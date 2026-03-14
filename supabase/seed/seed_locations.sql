insert into public.locations (name, campus_area, hours_text, hours_url, active, sort_order)
values
  ('Vail Commons', 'Main Campus', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/vail-commons', true, 10),
  ('Davis Cafe', 'Alvarez College Union', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/davis-cafe', true, 20),
  ('Wildcat Den', 'Baker Sports Complex', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/wildcat-den', true, 30),
  ('Commons Market', 'Vail Commons', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/commons-market', true, 40),
  ('Qdoba', 'Outside Student Union', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/qdoba', true, 50),
  ('Chick-fil-A', 'Outside Student Union', 'See Dining Services for current hours', 'https://www.davidson.edu/offices-and-services/dining-services/dining-locations/chick-fil-a', true, 60),
  ('Summit Coffee Outpost', 'Patterson Court Circle', 'See Dining Services for current hours', 'https://www.davidson.edu/campus-life/campus-and-surroundings/campus-spaces/student-life-facilities/summit-coffee-outpost', true, 70)
on conflict (name) do update set
  campus_area = excluded.campus_area,
  hours_text = excluded.hours_text,
  hours_url = excluded.hours_url,
  active = excluded.active,
  sort_order = excluded.sort_order,
  updated_at = now();
