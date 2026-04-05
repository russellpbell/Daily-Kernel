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
                        Text("Read")
                            .font(.caption2)
                    }
                    .foregroundStyle(.green)
                }

                Text(item.savedAt.relativeDate())
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }

            // Title
            Text(item.title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
                .lineLimit(isExpanded ? nil : 2)

            // Summary
            Text(item.summary)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
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
                    .sheet(isPresented: $showWebView) {
                        SafariWebView(url: url)
                    }
                } else {
                    HStack(spacing: 4) {
                        Image(systemName: "link")
                            .font(.caption2)
                        Text(sourceName)
                            .font(.caption)
                    }
                    .foregroundStyle(.gray)
                }
            }

            // Expanded content: notes editor
            if isExpanded {
                VStack(alignment: .leading, spacing: 8) {
                    Divider()
                        .background(Color.appSurfaceLight)

                    Text("Notes")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.gray)

                    TextField("Add notes...", text: $editingNotes, axis: .vertical)
                        .textFieldStyle(.plain)
                        .font(.caption)
                        .foregroundStyle(.white)
                        .padding(10)
                        .background(Color.appSurface)
                        .cornerRadius(8)
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
                }
                .foregroundStyle(Color.appPrimaryLight)
            }
            .frame(height: 30)
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
    }
}
