/*
  # Add sample classes

  1. Sample Data
    - Adds sample classes for the next 30 days
    - Includes different types of activities:
      - Zumba Suau
      - Pilates
      - Microgimnàstica
    - Each class has:
      - Title
      - Description
      - Schedule
      - Duration
      - Max participants
      - Instructor
      - Location
*/

DO $$
DECLARE
  v_date date;
  v_time time;
  v_end_date date;
  v_class record;
BEGIN
  v_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '30 days';
  v_time := '10:00:00'::time;

  FOR v_class IN
    SELECT *
    FROM (VALUES
      (
        'Zumba Suau',
        'Ball i exercici adaptat per a totes les edats. Classes divertides i energètiques que milloren la coordinació i la resistència.',
        INTERVAL '1 hour',
        15,
        'Maria Garcia',
        'Centre Cívic La Salut'
      ),
      (
        'Pilates',
        'Exercicis suaus per millorar la flexibilitat i l''equilibri. Ideal per enfortir els músculs i millorar la postura.',
        INTERVAL '1 hour',
        12,
        'Laura Martí',
        'Centre Cívic La Salut'
      ),
      (
        'Microgimnàstica',
        'Exercicis adaptats per mantenir-nos en forma. Sessions suaus i progressives per millorar la mobilitat.',
        INTERVAL '1 hour',
        10,
        'Anna Soler',
        'Centre Cívic Torre Mena'
      )
    ) AS t (title, description, duration, max_participants, instructor_name, location)
  LOOP
    WHILE v_date <= v_end_date LOOP
      -- Skip weekends
      IF EXTRACT(DOW FROM v_date) BETWEEN 1 AND 5 THEN
        -- Insert class if it doesn't exist
        INSERT INTO classes (
          title,
          description,
          datetime,
          duration,
          max_participants,
          instructor_name,
          location
        )
        SELECT
          v_class.title,
          v_class.description,
          v_date + v_time,
          v_class.duration,
          v_class.max_participants,
          v_class.instructor_name,
          v_class.location
        WHERE NOT EXISTS (
          SELECT 1
          FROM classes
          WHERE datetime = v_date + v_time
          AND title = v_class.title
        );
      END IF;
      
      v_date := v_date + INTERVAL '1 day';
    END LOOP;
    
    -- Reset date for next activity type
    v_date := CURRENT_DATE;
    -- Adjust time for next activity
    v_time := v_time + INTERVAL '1 hour 30 minutes';
  END LOOP;
END;
$$;