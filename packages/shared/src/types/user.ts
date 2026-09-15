export interface IUser {
  uuid: string;
  notion_user_id: string;
  clickup_connected: boolean;
  name: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
