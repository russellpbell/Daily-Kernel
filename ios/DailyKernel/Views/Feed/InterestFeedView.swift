import SwiftUI

struct InterestFeedView: View {
    @State private var items: [FeedItem] = []
    @State private var isLoading = true
    @State private var isLoadingMore = false
    @State private var hasMore = true
    @State private var selectedFilter: FeedFilter = .all
    @State private var errorMessage: String?
    @State private var showError = false

    @Environment(\.dismiss) private var dismiss

    private let api = APIClient.shared

    enum FeedFilter: String, CaseIterable {
        case all = "all"
        case liked = "liked"
        case saved = "saved"

        var label: String {
            switch self {
            case .all: return "All"
            case .liked: return "Liked"
            case .saved: return "Saved"
            }
        }
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Filter pills
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(FeedFilter.allCases, id: \.self) { filter in
                            Button {
                                if selectedFilter != filter {
                                    selectedFilter = filter
                                    Task { await loadFeed(reset: true) }
                                }
                            } label: {
                                Text(filter.label)
                                    .font(.subheadline.weight(.medium))
                                    .foregroundStyle(
                                        selectedFilter == filter ? .white : .gray
                                    )
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        selectedFilter == filter
                                            ? Color.appPrimary
                                            : Color.appSurface
                                    )
                                    .cornerRadius(20)
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 12)
                }

                if isLoading {
                    Spacer()
                    LoadingView(message: "Loading feed...")
                    Spacer()
                } else if items.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "tray",
                        message: "No items in your feed yet",
                        detail: "Review some briefing cards to see them here"
                    )
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(items) { item in
                                FeedCardView(item: item)

                                if item.id == items.last?.id && hasMore {
                                    ProgressView()
                                        .tint(Color.appPrimaryLight)
                                        .padding()
                                        .onAppear {
                                            if !isLoadingMore && hasMore {
                                                Task { await loadMore() }
                                            }
                                        }
                                }
                            }
                        }
                        .padding(.horizontal)
                        .padding(.bottom, 20)
                    }
                    .refreshable {
                        await loadFeed(reset: true)
                    }
                }
            }
        }
        .navigationTitle("Interest Feed")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Done") { dismiss() }
                    .foregroundStyle(Color.appPrimaryLight)
            }
        }
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage ?? "Something went wrong")
        }
        .task {
            await loadFeed(reset: true)
        }
    }

    private func loadFeed(reset: Bool) async {
        if reset {
            isLoading = true
            items = []
        }
        do {
            let filterParam = selectedFilter == .all ? nil : selectedFilter.rawValue
            let response = try await api.getFeed(cursor: nil, filter: filterParam)
            items = response.items
            hasMore = response.hasMore
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }

    private func loadMore() async {
        guard !isLoadingMore, hasMore, let lastItem = items.last else { return }
        isLoadingMore = true
        do {
            let filterParam = selectedFilter == .all ? nil : selectedFilter.rawValue
            let response = try await api.getFeed(
                cursor: lastItem.id,
                filter: filterParam
            )
            items.append(contentsOf: response.items)
            hasMore = response.hasMore
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoadingMore = false
    }
}
