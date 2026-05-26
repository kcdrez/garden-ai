from django.contrib import admin

from .models import AIConversation, AIMessage


class AIMessageInline(admin.TabularInline):
    model = AIMessage
    readonly_fields = ("role", "content", "input_tokens", "output_tokens", "created_at")
    extra = 0


@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "scope", "garden", "bed", "plant", "created_at")
    list_filter = ("scope",)
    inlines = [AIMessageInline]


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "conversation", "role", "created_at", "input_tokens", "output_tokens")
    list_filter = ("role",)
