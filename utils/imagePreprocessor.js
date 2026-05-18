import * as ImageManipulator from 'expo-image-manipulator';

export async function preprocessImage(imageUri) {
  const result = await ImageManipulator.manipulateAsync(
    imageUri,
    [
      { resize: { width: 2048 } },
    ],
    {
      compress: 0.95,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  return result;
}