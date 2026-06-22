type MergeLoadingView = {
    renderLoading: () => void;
};

const showMergeLoading = (view: MergeLoadingView) => {
    view.renderLoading();
};

export { showMergeLoading };
