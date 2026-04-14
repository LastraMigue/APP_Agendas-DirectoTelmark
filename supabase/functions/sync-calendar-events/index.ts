Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'Sync calendar events function placeholder' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
