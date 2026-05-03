import { Text, TextInput, TextProps, TextInputProps, StyleSheet } from 'react-native';
import { fontFamily } from '../theme';

export function AppText({ style, ...props }: TextProps) {
  return <Text style={[styles.text, style]} {...props} />;
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return <TextInput style={[styles.text, style]} {...props} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: fontFamily.regular,
  },
});
