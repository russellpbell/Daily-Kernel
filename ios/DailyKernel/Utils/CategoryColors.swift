import SwiftUI

struct CategoryColors {
    static let palette: [(Color, Color)] = [
        (Color(hex: "6366f1"), Color(hex: "4f46e5")),  // indigo
        (Color(hex: "ec4899"), Color(hex: "db2777")),  // pink
        (Color(hex: "14b8a6"), Color(hex: "0d9488")),  // teal
        (Color(hex: "f59e0b"), Color(hex: "d97706")),  // amber
        (Color(hex: "8b5cf6"), Color(hex: "7c3aed")),  // violet
        (Color(hex: "06b6d4"), Color(hex: "0891b2")),  // cyan
        (Color(hex: "f43f5e"), Color(hex: "e11d48")),  // rose
        (Color(hex: "22c55e"), Color(hex: "16a34a")),  // green
        (Color(hex: "3b82f6"), Color(hex: "2563eb")),  // blue
        (Color(hex: "a855f7"), Color(hex: "9333ea")),  // purple
    ]

    static func forCategory(_ name: String) -> (Color, Color) {
        var hash = 0
        for char in name.unicodeScalars {
            hash = 31 &* hash &+ Int(char.value)
        }
        let index = abs(hash) % palette.count
        return palette[index]
    }
}
