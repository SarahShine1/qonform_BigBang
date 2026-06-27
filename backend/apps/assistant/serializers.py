from rest_framework import serializers


class AssistantQuerySerializer(serializers.Serializer):
    question = serializers.CharField(required=True, allow_blank=False, trim_whitespace=True)
    context = serializers.DictField(required=False, default=dict)


class AssistantResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    intent = serializers.CharField()
    sources = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    quick_links = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list,
    )

