import { useLocalSearchParams } from 'expo-router'
import { Text, View } from 'react-native'
import { useThemeColor } from '~/lib/use-app-theme'

// Dynamic detail route. Wired automatically by core's generator to
// /a/<orgSlug>/{{PKG_SLUG}}/<id>.

export default function {{PKG_PASCAL}}Detail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')

    return (
        <View className="p-6 gap-3">
            <Text style={{ color: fg, fontSize: 22, fontWeight: '600' }}>{{PKG_NAME}} detail</Text>
            <Text style={{ color: muted, fontSize: 14 }}>Showing item {id}</Text>
        </View>
    )
}
