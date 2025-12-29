
/**
 * Downsamples data to a target size to prevent performance issues in charts.
 * @param data The source array of data
 * @param targetCount The maximum number of points to keep (default 500)
 * @returns A sampled subset of the data
 */
export const sampleData = <T>(data: T[], targetCount: number = 500): T[] => {
    if (!data || data.length <= targetCount) {
        return data;
    }

    const step = Math.ceil(data.length / targetCount);
    const sampled: T[] = [];

    for (let i = 0; i < data.length; i += step) {
        sampled.push(data[i]);
    }

    // Always ensure the last last point is included to show the full range
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
        sampled.push(data[data.length - 1]);
    }

    return sampled;
};
