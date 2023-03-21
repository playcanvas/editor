function toFixed(num, precision) {
    return (+(Math.round(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision);
}

// helper method to convert size in bytes to formatted string in appropriate measure
const sizeToString = (size) => {
    if (isNaN(size) || !size) return '0 KB';
    if (size / 1000 > 1000) {
        // display size in MB
        return `${toFixed(size / 1000 / 1000, 1)} MB`;
    }
    return `${toFixed(size / 1000, 0)} KB`;
};

export { sizeToString };
