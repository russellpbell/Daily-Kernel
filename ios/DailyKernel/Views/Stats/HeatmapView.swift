import SwiftUI

struct HeatmapView: View {
    let completions: [DailyCompletion]

    @State private var displayedMonth: Date = Date()
    @State private var monthChangeCount = 0

    private let calendar = Calendar.current
    private let dayHeaders = ["S", "M", "T", "W", "T", "F", "S"]
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 4), count: 7)

    private var completionMap: [String: DailyCompletion] {
        Dictionary(uniqueKeysWithValues: completions.map { ($0.date, $0) })
    }

    private var monthLabel: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMMM yyyy"
        return formatter.string(from: displayedMonth)
    }

    private var daysInMonth: [DayItem] {
        let range = calendar.range(of: .day, in: .month, for: displayedMonth)!
        let components = calendar.dateComponents([.year, .month], from: displayedMonth)
        guard let firstOfMonth = calendar.date(from: components) else { return [] }

        let firstWeekday = calendar.component(.weekday, from: firstOfMonth)
        let leadingBlanks = firstWeekday - 1

        var items: [DayItem] = []

        // Leading blanks
        for i in 0..<leadingBlanks {
            items.append(DayItem(id: "blank-\(i)", day: nil, date: nil))
        }

        // Actual days
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: Date())

        for day in range {
            var dayComponents = components
            dayComponents.day = day
            let date = calendar.date(from: dayComponents)!
            let dateString = dateFormatter.string(from: date)

            items.append(DayItem(
                id: dateString,
                day: day,
                date: dateString,
                isToday: dateString == todayString,
                completion: completionMap[dateString]
            ))
        }

        return items
    }

    var body: some View {
        VStack(spacing: 12) {
            // Month navigation
            HStack {
                Button {
                    navigateMonth(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Color.appPrimaryLight)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Previous month")

                Spacer()

                Text(monthLabel)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.primary)
                    .contentTransition(.numericText())

                Spacer()

                Button {
                    navigateMonth(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.body.weight(.semibold))
                        .foregroundStyle(Color.appPrimaryLight)
                        .frame(width: 44, height: 44)
                }
                .accessibilityLabel("Next month")
            }

            // Day headers
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(dayHeaders, id: \.self) { header in
                    Text(header)
                        .font(.caption2.weight(.medium))
                        .foregroundStyle(.secondary)
                        .frame(height: 24)
                }
            }

            // Day cells
            LazyVGrid(columns: columns, spacing: 4) {
                ForEach(daysInMonth) { item in
                    if let day = item.day {
                        dayCell(day: day, item: item)
                    } else {
                        Color.clear
                            .frame(height: 36)
                    }
                }
            }
        }
        .padding(16)
        .background(
            ZStack {
                Color.green.opacity(0.03)
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(.ultraThinMaterial)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.glassBorder, lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.12), radius: 8, y: 4)
        .sensoryFeedback(.selection, trigger: monthChangeCount)
    }

    @ViewBuilder
    private func dayCell(day: Int, item: DayItem) -> some View {
        let ratio = completionRatio(for: item)

        Text("\(day)")
            .font(.caption2.monospacedDigit())
            .foregroundStyle(ratio > 0 ? .white : .secondary)
            .frame(width: 36, height: 36)
            .background(cellBackground(ratio: ratio, isToday: item.isToday))
            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            .overlay(
                item.isToday
                    ? RoundedRectangle(cornerRadius: 8, style: .continuous)
                        .strokeBorder(Color.appPrimaryLight, lineWidth: 2)
                    : nil
            )
            .shadow(
                color: item.isToday ? Color.appPrimary.opacity(0.3) : .clear,
                radius: 4, y: 2
            )
            .accessibilityLabel(dayCellAccessibilityLabel(day: day, item: item))
    }

    @ViewBuilder
    private func cellBackground(ratio: Double, isToday: Bool) -> some View {
        if isToday && ratio <= 0 {
            // Glass effect for today's cell even without completions
            ZStack {
                Color.appPrimary.opacity(0.1)
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(.ultraThinMaterial)
            }
        } else {
            cellColor(ratio: ratio)
        }
    }

    private func completionRatio(for item: DayItem) -> Double {
        guard let completion = item.completion, completion.cardsTotal > 0 else { return 0 }
        return Double(completion.cardsReviewed) / Double(completion.cardsTotal)
    }

    private func cellColor(ratio: Double) -> Color {
        if ratio <= 0 {
            return Color.appSurfaceLight.opacity(0.3)
        } else if ratio < 0.5 {
            return Color.green.opacity(0.25)
        } else if ratio < 1.0 {
            return Color.green.opacity(0.5)
        } else {
            return Color.green.opacity(0.8)
        }
    }

    private func navigateMonth(by value: Int) {
        if let newDate = calendar.date(byAdding: .month, value: value, to: displayedMonth) {
            withAnimation(.easeInOut(duration: 0.2)) {
                displayedMonth = newDate
            }
            monthChangeCount += 1
        }
    }

    private func dayCellAccessibilityLabel(day: Int, item: DayItem) -> String {
        let ratio = completionRatio(for: item)
        let dateLabel = "\(monthLabel) \(day)"
        if item.isToday {
            if ratio > 0 {
                return "Today, \(dateLabel), \(Int(ratio * 100))% complete"
            }
            return "Today, \(dateLabel)"
        }
        if ratio > 0 {
            return "\(dateLabel), \(Int(ratio * 100))% complete"
        }
        return dateLabel
    }
}

private struct DayItem: Identifiable {
    let id: String
    let day: Int?
    let date: String?
    var isToday: Bool = false
    var completion: DailyCompletion?
}
