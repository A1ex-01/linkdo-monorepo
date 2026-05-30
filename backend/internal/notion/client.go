package notion

import (
    "github.com/jomei/notionapi"
)

type Client struct {
    client *notionapi.Client
}

func NewClient(accessToken string) *Client {
    return &Client{
        client: notionapi.NewClient(notionapi.Token(accessToken)),
    }
}

func (c *Client) Notion() *notionapi.Client {
    return c.client
}
