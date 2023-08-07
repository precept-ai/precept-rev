import logging
from datetime import datetime
from typing import List, Dict

from pydantic import BaseModel
from data_source.api.base_data_source import BaseDataSource, BaseDataSourceConfig, ConfigField
from data_source.api.basic_document import BasicDocument, DocumentType, FileType
from queues.index_queue import IndexQueue
import requests
import json 
from datetime import timezone


class NotionConfig(BaseDataSourceConfig):
    token: str


class NotionDataSource(BaseDataSource):

    @staticmethod
    def get_config_fields() -> List[ConfigField]:
        return [
            ConfigField(
                label='notion token', name='token', placeholder='Enter your notion token',
            )
        ]

    @staticmethod
    async def validate_config(config: Dict) -> None:
        print('heeeeeeeeeeyy')
        print(config)
        pass 
        # try: 
        #     token = config['token']
        #     url = 'https://api.notion.com/v1/search'
        #     headers = {
        #         'Authorization': f'Bearer {token}',
        #         'Content-Type': 'application/json',
        #         'Notion-Version': '2022-06-28'
        #     }
        #     data = {
        #         "page_size": "1"
        #     }
        #     response = requests.post(url, headers=headers, json=data)

        #     if response.status_code != 200:
        #         raise Exception(f'Connection to notion failed, code {response.status_code}')
        #     # send a request to notion with the token in the config
        # except Exception as e:
        #     raise Exception(f'Connection to notion failed {e}')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        notion_config = NotionConfig(**self._raw_config)
        self.notion_token = notion_config.token

    def get_page_content(self, page_id):
        url = "https://api.notion.com/v1/blocks/" + page_id + "/children?page_size=100"

        headers = {
        "accept": "application/json",
        "Authorization": "Bearer " + self.notion_token,
        "Notion-Version": "2022-06-28",
        "content-type": "application/json"
        }

        notion_response = requests.get(url, headers=headers)
        notion_data = json.loads(notion_response.text)
        notion_text = ""

        if len(notion_data["results"]) > 0:
            for block in notion_data["results"]:
                if block["type"] == "heading_1" and len(block["heading_1"]["rich_text"]) > 0:
                    notion_text += "# " + block["heading_1"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "heading_2" and len(block["heading_2"]["rich_text"]) > 0:
                    notion_text += "## " + block["heading_2"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "heading_3" and len(block["heading_3"]["rich_text"]) > 0:
                    notion_text += "### " + block["heading_3"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "paragraph" and len(block["paragraph"]["rich_text"]) > 0:
                    notion_text += block["paragraph"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "bulleted_list_item" and len(block["bulleted_list_item"]["rich_text"]) > 0:
                    notion_text += "- " + block["bulleted_list_item"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "numbered_list_item" and len(block["numbered_list_item"]["rich_text"]) > 0:
                    notion_text += "1. " + block["numbered_list_item"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "to_do" and len(block["to_do"]["rich_text"]) > 0:
                    notion_text += "- [ ] " + block["to_do"]["rich_text"][0]["plain_text"] + "\n"
                elif block["type"] == "toggle" and len(block["toggle"]["rich_text"]) > 0:
                    notion_text += "" + block["toggle"]["rich_text"][0]["plain_text"] + "\n"
        return notion_text

    def _feed_new_documents(self) -> None:
        url = "https://api.notion.com/v1/search"
        headers = {
            "accept": "application/json",
            "Authorization": "Bearer " + self.notion_token,
            "Notion-Version": "2022-06-28",
            "content-type": "application/json"
        }
        notion_response = requests.post(url, headers=headers)
        notion_data = json.loads(notion_response.text)

        docs = []
        for item in notion_data["results"]:
            print('NEW ITEM')
            title = ""
            if item["properties"].get("title"):
                title = item["properties"]["title"]["title"][0]["plain_text"]

            elif item["properties"].get("Task name"):
                    if isinstance(item["properties"]["Task name"].get("title"), list):
                        title = item["properties"]["Task name"]["title"][0]["plain_text"]
                    else:
                        title = item["properties"]["Task name"]["name"]
            else:
                title = ""

            page_content = ""

            if item["object"] == "page":
                page_content = self.get_page_content(item["id"])

            doc = BasicDocument(**{
                "id": item["id"],
                "data_source_id": self._data_source_id,
                "type": DocumentType.DOCUMENT,
                "title": title,
                "content": page_content,
                "author": item["created_by"]["id"],
                "author_image_url": "",
                "url": item["url"],
                "location": item["parent"]["page_id"] if item["parent"]["type"] == "page" else item["parent"]["database_id"] if item["parent"]["type"] == "database_id" else "",
                "timestamp": datetime.strptime(item["last_edited_time"], "%Y-%m-%dT%H:%M:%S.%f%z"),
                'file_type': FileType.TXT,
            })
            print(f'INDEXING {doc.title}')
            last_modified = doc.timestamp 
            if last_modified.replace(tzinfo=timezone.utc) < self._last_index_time.replace(tzinfo=timezone.utc):
                print(f"Message {doc.title}, {doc.id} is too old, skipping")
                continue
            IndexQueue.get_instance().put_single(doc)
