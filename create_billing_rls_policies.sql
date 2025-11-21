-- Crear políticas RLS para la tabla billing
-- Estas políticas permitirán a usuarios autenticados y anónimos insertar facturas

-- Política 1: Permitir INSERT a usuarios autenticados
CREATE POLICY "Allow authenticated users to insert billing" ON public.billing
FOR INSERT TO authenticated
WITH CHECK (true);

-- Política 2: Permitir INSERT a usuarios anónimos (si es necesario)
CREATE POLICY "Allow anonymous users to insert billing" ON public.billing  
FOR INSERT TO anon
WITH CHECK (true);

-- Política 3: Permitir SELECT a usuarios autenticados para ver sus propias facturas
CREATE POLICY "Allow authenticated users to view billing" ON public.billing
FOR SELECT TO authenticated
USING (true);

-- Política 4: Permitir SELECT a usuarios anónimos (si es necesario)
CREATE POLICY "Allow anonymous users to view billing" ON public.billing
FOR SELECT TO anon
USING (true);

-- Alternativamente, si no necesitas RLS, puedes deshabilitarlo:
-- ALTER TABLE public.billing DISABLE ROW LEVEL SECURITY;