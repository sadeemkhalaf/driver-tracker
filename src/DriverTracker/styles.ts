import { Dimensions, StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
      },
});
