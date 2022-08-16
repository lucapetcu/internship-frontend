export interface UserResponse {
    status: string,
    users: { _id: string, user_email: string, user_name: string }[]
}