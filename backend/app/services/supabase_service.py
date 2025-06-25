from supabase import create_client, Client
from typing import List, Optional, Dict, Any
from ..models.workflow import N8NWorkflow
from ..core.config import settings
from ..core.auth import CurrentUser
from ..core.config_loader import config_loader
import structlog
import json

logger = structlog.get_logger()


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
        
        # Use UPSERT to handle race conditions and concurrent workflow saves
        result = self.client.table("workflows").upsert(
            workflow_data, 
            on_conflict="id",
            ignore_duplicates=False  # Update if exists
        ).execute()
        return result.data[0] if result.data else None

    async def get_user_workflows(self, user_id: str) -> List[Dict[str, Any]]:
        result = self.client.table("workflows")\
            .select("*")\
            .eq("owner_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        return result.data

    async def get_workflow(self, workflow_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        logger.info("Getting workflow from database", workflow_id=workflow_id, user_id=user_id)
        
        result = self.client.table("workflows")\
            .select("*")\
            .eq("id", workflow_id)\
            .eq("owner_id", user_id)\
            .execute()
        
        workflow = result.data[0] if result.data else None
        
        if workflow:
            logger.info("Workflow found in database",
                       workflow_id=workflow_id,
                       workflow_name=workflow.get('name'),
                       has_workflow_data=bool(workflow.get('workflow_data')),
                       workflow_data_type=type(workflow.get('workflow_data')).__name__ if workflow.get('workflow_data') else 'None')
        else:
            logger.warning("Workflow not found in database", 
                          workflow_id=workflow_id, 
                          user_id=user_id,
                          query_result_count=len(result.data) if result.data else 0)
        
        return workflow

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
        conversation_id: Optional[str] = None,  # Make conversation_id optional
        workflow_id: Optional[str] = None,
        title: Optional[str] = None
    ) -> Dict[str, Any]:
        conversation_data = {
            "user_id": user_id,
            "workflow_id": workflow_id,
            "title": title,
            "total_tokens": 0
        }
        
        # Only set ID if provided, otherwise let database generate UUID
        if conversation_id:
            conversation_data["id"] = conversation_id
        
        # Simple insert since we check for existence before calling this method
        result = self.client.table("conversations").insert(conversation_data).execute()
        conversation = result.data[0] if result.data else None
        
        # QUICK FIX: If conversation has workflow_id, add workflow context as system message
        if conversation and workflow_id:
            try:
                logger.info("Adding workflow context to new conversation", 
                           conversation_id=conversation_id, workflow_id=workflow_id)
                
                # Get the workflow data
                workflow = await self.get_workflow(workflow_id, user_id)
                if workflow and workflow.get('workflow_data'):
                    # Add system message with workflow context
                    workflow_context_message = f"""CURRENT WORKFLOW CONTEXT:
                    
Name: {workflow.get('name', 'Untitled')}
Description: {workflow.get('description', 'No description')}
Nodes: {len(workflow.get('workflow_data', {}).get('nodes', []))} nodes
Last Updated: {workflow.get('updated_at')}

Workflow Structure:
{json.dumps(workflow.get('workflow_data'), indent=2)}

You are helping the user modify, understand, or extend this specific n8n workflow."""
                    
                    await self.add_message(
                        conversation_id=conversation_id,
                        content=workflow_context_message,
                        role="system",
                        message_type="text",
                        workflow_data=workflow.get('workflow_data'),
                        token_count=len(workflow_context_message.split())
                    )
                    
                    logger.info("Added workflow context system message", 
                               conversation_id=conversation_id,
                               workflow_name=workflow.get('name'),
                               message_length=len(workflow_context_message))
                else:
                    logger.warning("Workflow found but no workflow_data", 
                                  workflow_id=workflow_id, has_workflow=bool(workflow))
            except Exception as e:
                logger.error("Failed to add workflow context to conversation", 
                           error=str(e), conversation_id=conversation_id, workflow_id=workflow_id)
                # Don't fail conversation creation if this fails
        
        return conversation

    async def add_message(
        self,
        conversation_id: str,
        content: str,
        role: str,
        message_type: str = "text",
        workflow_data: Optional[Dict[str, Any]] = None,
        token_count: int = 0
    ) -> Dict[str, Any]:
        # Truncate content if too long to prevent database issues
        max_content_length = 50000  # Reasonable limit for message content
        if len(content) > max_content_length:
            logger.warning("Message content truncated", 
                         original_length=len(content), 
                         truncated_length=max_content_length,
                         conversation_id=conversation_id)
            content = content[:max_content_length] + "\n\n[Message truncated due to length]"
        
        message_data = {
            "conversation_id": conversation_id,
            "content": content,
            "role": role,
            "message_type": message_type,
            "workflow_data": workflow_data,
            "token_count": token_count
        }
        
        try:
            result = self.client.table("messages").insert(message_data).execute()
        except Exception as e:
            logger.error("Failed to insert message", 
                        error=str(e),
                        conversation_id=conversation_id,
                        content_length=len(content),
                        role=role,
                        message_type=message_type)
            raise
        
        # Update conversation total tokens
        conv_result = self.client.table("conversations")\
            .select("total_tokens")\
            .eq("id", conversation_id)\
            .single()\
            .execute()

        if conv_result.data:
            current_tokens = conv_result.data.get("total_tokens", 0) or 0
            new_total = current_tokens + token_count
            
            self.client.table("conversations")\
                .update({"total_tokens": new_total})\
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
        
        # Get context limit from model configuration
        context_limit = config_loader.get_model_context_window(model_key)
        
        # Get messages ordered by creation time
        messages_result = self.client.table("messages")\
            .select("*")\
            .eq("conversation_id", conversation_id)\
            .order("created_at", desc=False)\
            .execute()
        
        messages = messages_result.data
        
        # Filter messages to fit within token limit if context limit is set
        if context_limit and context_limit > 0:
            filtered_messages = []
            total_tokens = 0
            
            # Process messages in reverse order to get most recent first
            for message in reversed(messages):
                message_tokens = message.get("token_count", 0) or 0
                if total_tokens + message_tokens <= context_limit:
                    filtered_messages.insert(0, message)
                    total_tokens += message_tokens
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

    async def get_conversation_by_id(self, conversation_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific conversation by ID and user ID."""
        result = self.client.table("conversations")\
            .select("*")\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()
        
        return result.data[0] if result.data else None

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

    async def update_conversation_workflow(self, conversation_id: str, user_id: str, workflow_id: str):
        """Updates the workflow_id of a conversation."""
        result = self.client.table("conversations")\
            .update({"workflow_id": workflow_id})\
            .eq("id", conversation_id)\
            .eq("user_id", user_id)\
            .execute()
        return result.data[0] if result.data else None


supabase_service = SupabaseService()
