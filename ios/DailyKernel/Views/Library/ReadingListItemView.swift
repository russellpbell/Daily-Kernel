import SwiftUI

struct ReadingListItemView: View {
    let item: ReadingListItem
    var onMarkRead: () -> Void
    var onDelete: () -> Void
    var onUpdateNotes: (String) -> Void

    @State private var isExpanded = false
    @State private var editingNotes = ""
    @State private var showWebView = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Category + date
            HStack {
                CategoryBadge(name: item.categoryName)

                Spacer()

                if item.isRead {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption2)
                            .symbolRenderingMode(.hierarchical)
                        Text("Read")
                            .font(.caption2)
                    }
                    .foregroundStyle(.green)
                }

                Text(item.savedAt.relativeDate())
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }

            // Title
            Text(item.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.primary)
                .lineLimit(isExpanded ? nil : 2)

            // Summary
            Text(item.summary)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineSpacing(2)
                .lineLimit(isExpanded ? nil : 3)

            // Source link
            if let sourceName = item.sourceName {
                if let sourceUrl = item.sourceUrl, let url = URL(string: sourceUrl) {
                    Button {
                        showWebView = true
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "safari")
                                .font(.caption2)
                            Text(sourceName)
                                .font(.caption)
                                .lineLimit(1)
                        }
                        .foregroundStyle(Color.appPrimaryLight)
                    }
                    .accessibilityLabel("Open \(sourceName) in browser")
                    .sheet(isPresented: $showWebView) {
                        SafariWebView(url: url)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "link")
                            .font(.caption2)
                            .symbolRenderingMode(.hierarchical)
                        Text(sourceName)
                            .font(.caption)
                    }
                    .foregroundStyle(.tertiary)
                }
            }

            // Expanded content: notes editor
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                        .overlay(Color.glassBorder)

                    Text("Notes")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)

                    TextField("Add notes...", text: $editingNotes, axis: .vertical)
                        .textFieldStyle(.plain)
                        .font(.caption)
                        .foregroundStyle(.primary)
                        .padding(10)
                        .background(.ultraThinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .strokeBorder(Color.glassBorder, lineWidth: 0.5)
                        )
                        .lineLimit(3...8)
                        .onChange(of: editingNotes) { _, newValue in
                            onUpdateNotes(newValue)
                        }
                }
                .transition(.opacity.combined(with: .move(edge: .top)))
            }

            // Expand / collapse
            Button {
                withAnimation(.spring(response: 0.3)) {
                    isExpanded.toggle()
                    if isExpanded {
                        editingNotes = item.notes ?? ""
                    }
                }
            } label: {
                HStack {
                    Text(isExpanded ? "Show less" : "Show more")
                        .font(.caption2)
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption2)
                        .contentTransition(.symbolEffect(.replace))
                }
                .foregroundStyle(Color.appPrimaryLight)
            }
            .frame(height: 30)
            .accessibilityLabel(isExpanded ? "Collapse details" : "Expand details")
        }
        .padding(.vertical, 4)
        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
            Button(role: .destructive) {
                onDelete()
            } label: {
                Label("Delete", systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: true) {
            Button {
                onMarkRead()
            } label: {
                Label("Read", systemImage: "checkmark.circle")
            }
            .tint(.green)
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(item.categoryName): \(item.title)\(item.isRead ? ", read" : "")")
    }
}
