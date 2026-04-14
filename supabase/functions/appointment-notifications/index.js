Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ message: 'Appointment notifications function placeholder' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
