/*
  # Actualizar horario de clases

  1. Cambios
    - Zumba Suau: solo lunes y miércoles
    - Pilates: solo martes y jueves
    - Microgimnàstica: solo viernes

  2. Implementación
    - Elimina las clases existentes
    - Crea nuevas clases con los horarios correctos
*/

-- Primero, eliminar todas las clases existentes
DELETE FROM classes;

-- Función para crear clases en días específicos
CREATE OR REPLACE FUNCTION create_classes_for_days(
  p_title text,
  p_description text,
  p_duration interval,
  p_max_participants integer,
  p_instructor_name text,
  p_location text,
  p_days integer[]
) RETURNS void AS $$
DECLARE
  v_date date;
  v_end_date date;
  v_time time;
  v_day_of_week integer;
BEGIN
  -- Configurar fechas
  v_date := CURRENT_DATE;
  v_end_date := CURRENT_DATE + INTERVAL '30 days';
  v_time := '10:00:00'::time;

  WHILE v_date <= v_end_date LOOP
    v_day_of_week := EXTRACT(DOW FROM v_date);
    
    -- Verificar si el día actual está en el array de días permitidos
    IF v_day_of_week = ANY(p_days) THEN
      -- Insertar clase si no existe
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
        p_title,
        p_description,
        v_date + v_time,
        p_duration,
        p_max_participants,
        p_instructor_name,
        p_location
      WHERE NOT EXISTS (
        SELECT 1
        FROM classes
        WHERE datetime = v_date + v_time
        AND title = p_title
      );
    END IF;
    
    v_date := v_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Crear clases para cada actividad
DO $$
BEGIN
  -- Zumba Suau: Lunes (1) y Miércoles (3)
  PERFORM create_classes_for_days(
    'Zumba Suau',
    'Ball i exercici adaptat per a totes les edats. Classes divertides i energètiques que milloren la coordinació i la resistència.',
    INTERVAL '1 hour',
    15,
    'Maria Garcia',
    'Centre Cívic La Salut',
    ARRAY[1, 3]
  );

  -- Pilates: Martes (2) y Jueves (4)
  PERFORM create_classes_for_days(
    'Pilates',
    'Exercicis suaus per millorar la flexibilitat i l''equilibri. Ideal per enfortir els músculs i millorar la postura.',
    INTERVAL '1 hour',
    12,
    'Laura Martí',
    'Centre Cívic La Salut',
    ARRAY[2, 4]
  );

  -- Microgimnàstica: Viernes (5)
  PERFORM create_classes_for_days(
    'Microgimnàstica',
    'Exercicis adaptats per mantenir-nos en forma. Sessions suaus i progressives per millorar la mobilitat.',
    INTERVAL '1 hour',
    10,
    'Anna Soler',
    'Centre Cívic Torre Mena',
    ARRAY[5]
  );
END;
$$;

-- Eliminar la función temporal
DROP FUNCTION create_classes_for_days(text, text, interval, integer, text, text, integer[]);