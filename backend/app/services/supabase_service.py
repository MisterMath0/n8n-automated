from supabase import create_client, Client
from typing import List, Optional, Dict, Any
from ..models.workflow import N8NWorkflow
from ..core.config import settings
from ..core.auth import CurrentUser
from ..core.config_loader import config_loader


class SupabaseService:
    def __init__(self):
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ValueError("Supabase URL and service role key are required")
        
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )

    async def save_workflow(
        self, 
        workflow: N8NWorkflow, 
        user: CurrentUser,
        name: Optional[str] = None,
        description: Optional[str] = None,
        ai_model_used: Optional[str] = None,
        generation_time_ms: Optional[int] = None,
        tokens_used: Optional[int] = None
    ) -> Dict[str, Any]:
        workflow_data = {
            "id": workflow.id,
            "name": name or workflow.name,
            "description": description,
            "workflow_data": workflow.model_dump(),
            "owner_id": user.id,
            "ai_model_used": ai_model_used,
            "generation_time_ms": generation_time_ms,
            "tokens_used": tokens_used,
            "last_generated_at": "now()",
            "status": "active"
        }
        
        result = self.client.table("workflows").insert(workflow_data).execute()
        return result.data[0] if result.data else None

    async def get_user_workflows(self, user_id: str) -> List[Dict[str, Any]]:
        result = self.client.table("workflows")\
            .select("*")\
            .eq("owner_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        return result.data

    async def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        result = self.client.table("workflows")\
            .select("*")\
            .eq("id", workflow_id)\
            .eq("owner_id", user_id)\
            .execute()
        return result.data[0] if result.data else None

    async def update_workflow(
        self, 
        workflow_id: str, 
        user_id: str, 
        updates: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        updates["updated_at"] = "now()"
        result = self.client.table("workflows")\
            .update(updates)\
            .eq("id", workflow_id)\
            .eq("owner_id", user_id)\
            .execute()
        return result.data[0] if result.data else None

    async def delete_workflow(self, workflow_id: str, user_id: str) -> bool:
        result = self.client.table("workflows")\
            .delete()\
            .eq("id", workflow_id)\
            .eq("owner_id", user_id)\
            .execute()
        return len(result.data) > 0

    async def create_conversation(
        self,
        user_id: str,
        workflow_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        conversation_data = {
            "user_id": user_id,
            "workflow_id": workflow_id,
            "title": title,
            "total_tokens": 0
        }
        
        result = self.client.table("conversations").insert(conversation_data).execute()
        return result.data[0] if result.data else None

    async def add_message(
        self,
        conversation_id: str,
        content: str,
        role: str,
        message_type: str = "text",
        workflow_data: Optional[Dict[str, Any]] = None,
        token_count: int = 0
    ) -> Dict[str, Any]:
        message_data = {
            "conversation_id": conversation_id,
            "content": content,
            "role": role,
            "message_type": message_type,
            "workflow_data": workflow_data,
            "token_count": token_count
        }
        
        result = self.client.table("messages").insert(message_data).execute()
        
        # Update conversation total tokens
        self.client.table("conversations")\
            .update({"total_tokens": f"total_tokens + {token_count}"})\
            .eq("id", conversation_id)\
            .execute()
        
        return result.data[0] if result.data else None

    async def get_conversation_messages(
        self,
        conversation_id: str,
        user_id: str,
        model_key: str
    ) -> List[Dict[str, Any]]:
        # First verify user owns the conversation
        conv_result = self.client.table("conversations")\
            .select("id")\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()
        
        if not conv_result.data:
            return []
        
        context_limit = config_loader.get_model_context_window(model_key)
        
        # Get messages ordered by creation time
        messages_result = self.client.table("messages")\
            .select("*")\
            .eq("conversation_id", conversation_id)\
            .order("created_at", desc=False)\
            .execute()
        
        messages = messages_result.data
        
        # Filter messages to fit within token limit
        if context_limit > 0:
            filtered_messages = []
            total_tokens = 0
            
            # Process messages in reverse order to get most recent first
            for message in reversed(messages):
                if total_tokens + message["token_count"] <= context_limit:
                    filtered_messages.insert(0, message)
                    total_tokens += message["token_count"]
                else:
                    break
            
            return filtered_messages
        
        return messages

    async def get_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        result = self.client.table("conversations")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        return result.data

    async def update_conversation_title(self, conversation_id: str, user_id: str, title: str):
        """Updates the title of a conversation."""
        result = self.client.table("conversations")\
            .update({"title": title})\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()
        return result.data[0] if result.data else None

    async def create_workflow_version(
        self,
        workflow_id: str,
        user_id: str,
        version_number: int,
        workflow_data: Dict[str, Any],
        changes_summary: List[str]
    ) -> Dict[str, Any]:
        version_data = {
            "workflow_id": workflow_id,
            "version_number": version_number,
            "workflow_data": workflow_data,
            "changes_summary": changes_summary,
            "created_by": user_id
        }
        
        result = self.client.table("workflow_versions").insert(version_data).execute()
        return result.data[0] if result.data else None

    async def get_workflow_versions(self, workflow_id: str, user_id: str) -> List[Dict[str, Any]]:
        result = self.client.table("workflow_versions")\
            .select("*")\
            .eq("workflow_id", workflow_id)\
            .eq("created_by", user_id)\
            .order("version_number", desc=True)\
            .execute()
        return result.data


supabase_service = SupabaseService()
