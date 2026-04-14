-- Seed appointments
INSERT INTO appointments (client_id, agent_id, title, description, start_time, end_time, status, type)
SELECT 
  c.id,
  a.id,
  'Initial Meeting',
  'First contact with client',
  NOW() + interval '1 day',
  NOW() + interval '1 day 1 hour',
  'pending',
  'meeting'
FROM clients c, agents a
WHERE c.name = 'Client A' AND a.name = 'John Smith'
LIMIT 1;
