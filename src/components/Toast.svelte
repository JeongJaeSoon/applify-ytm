<script lang="ts">
  interface Props { message: string | null; }
  const { message }: Props = $props();
</script>

<div class="toast" class:show={message !== null}>{message ?? ''}</div>
