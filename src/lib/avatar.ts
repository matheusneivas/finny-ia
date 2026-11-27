import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

import { ApiError } from '@/lib/api/client';
import { avatarApi } from '@/lib/api/endpoints';

const SIZE = 512;

/**
 * Escolhe uma foto (galeria ou câmera), recorta quadrada e re-encoda como
 * JPEG 512x512 no próprio aparelho. Re-encodar descarta EXIF (inclusive GPS)
 * e deixa o arquivo pequeno (~50-150 KB). Devolve o caminho local ou null.
 */
export async function pickAvatar(source: 'library' | 'camera'): Promise<string | null> {
  const perm =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    if (Platform.OS !== 'web') {
      Alert.alert(
        source === 'camera' ? 'Sem acesso à câmera' : 'Sem acesso às fotos',
        'Libere o acesso nos Ajustes para escolher sua foto de perfil.',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Abrir Ajustes', onPress: () => void Linking.openSettings() },
        ],
      );
    }
    return null;
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
    exif: false,
  };
  const result =
    source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled || !result.assets[0]) return null;

  const ref = await ImageManipulator.manipulate(result.assets[0].uri).resize({ width: SIZE, height: SIZE }).renderAsync();
  const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return saved.uri;
}

/** Pergunta de onde vem a foto (folha de ações nativa). */
export function chooseAvatarSource(onChoose: (source: 'library' | 'camera') => void, onRemove?: () => void) {
  if (Platform.OS === 'web') return onChoose('library');
  Alert.alert('Foto de perfil', undefined, [
    { text: 'Escolher da galeria', onPress: () => onChoose('library') },
    { text: 'Tirar foto', onPress: () => onChoose('camera') },
    ...(onRemove ? [{ text: 'Remover foto', style: 'destructive' as const, onPress: onRemove }] : []),
    { text: 'Cancelar', style: 'cancel' as const },
  ]);
}

export async function uploadAvatar(localUri: string): Promise<string> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(localUri)).blob();
    form.append('file', blob, 'avatar.jpg');
  } else {
    // No SDK 58 o fetch global é o expo/fetch, que só aceita Blob de verdade no
    // multipart. O File do expo-file-system é um Blob (tipo pela extensão .jpg).
    form.append('file', new File(localUri), 'avatar.jpg');
  }
  try {
    const res = await avatarApi.upload(form);
    return res.avatarUrl;
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) {
      throw new ApiError(404, 'A foto de perfil ainda não está disponível no servidor.');
    }
    if (e instanceof ApiError && e.status === 413) {
      throw new ApiError(413, 'Essa imagem é grande demais. Tente outra.');
    }
    throw e;
  }
}
