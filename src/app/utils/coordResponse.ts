export interface CoordResponse {
    status: string,
    locations: { _id: string, latitude: number, longitude: number }[]
}