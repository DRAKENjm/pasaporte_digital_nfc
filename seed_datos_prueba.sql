-- =================================================================================
-- PASAPORTE VIRTUAL NFC - SEED DATA DE PRUEBA Y DEMOSTRACIÓN
-- =================================================================================
-- Este script inserta datos de prueba coherentes para probar el backend,
-- la autenticación, escaneo NFC/QR, asignación de puntos, canjes y red social.
-- Ejecutar DESPUÉS de haber ejecutado pasaporte.sql
-- =================================================================================

-- ---------------------------------------------------------------------------------
-- 1. USUARIOS DE PRUEBA (Admin, Comercio y Cliente)
-- Las contraseñas hash corresponden al texto: "Password123!" con bcrypt
-- ---------------------------------------------------------------------------------
-- Asegurar que los roles base existan antes de vincular usuarios
INSERT INTO roles (nombre, descripcion) VALUES
('ADMIN', 'Administrador del sistema con acceso total'),
('CLIENTE', 'Usuario final portador del pasaporte y acumulador de sellos'),
('COMERCIO', 'Personal autorizado de establecimientos aliados')
ON CONFLICT (nombre) DO NOTHING;

-- Asegurar que las categorías base existan
INSERT INTO categorias_establecimiento (nombre, icono_url) VALUES
('Cafeterías y Panaderías', 'https://cdn-icons-png.flaticon.com/512/924/924514.png'),
('Restaurantes y Bares', 'https://cdn-icons-png.flaticon.com/512/3170/3170733.png'),
('Turismo y Aventura', 'https://cdn-icons-png.flaticon.com/512/201/201623.png'),
('Tiendas y Artesanías', 'https://cdn-icons-png.flaticon.com/512/869/869636.png')
ON CONFLICT (nombre) DO NOTHING;

DO $$
DECLARE
    v_rol_admin UUID;
    v_rol_comercio UUID;
    v_rol_cliente UUID;
    v_nivel_bronce UUID;
    v_nivel_plata UUID;
    v_user_admin UUID := 'b0000000-0000-0000-0000-000000000001';
    v_user_comercio UUID := 'b0000000-0000-0000-0000-000000000002';
    v_user_cliente UUID := 'b0000000-0000-0000-0000-000000000003';
    
    v_cat_cafe UUID;
    v_cat_rest UUID;
    v_est_cafe UUID := 'c0000000-0000-0000-0000-000000000001';
    v_est_rest UUID := 'c0000000-0000-0000-0000-000000000002';
    
    v_regla_cafe UUID := 'd0000000-0000-0000-0000-000000000001';
    v_regla_rest UUID := 'd0000000-0000-0000-0000-000000000002';
    v_rec_cafe UUID := 'e0000000-0000-0000-0000-000000000001';
    v_rec_postre UUID := 'e0000000-0000-0000-0000-000000000002';
    
    v_hash_demo VARCHAR := '$2a$10$wT5fE6qJ92C56eG4Hkln.ebNms9Z1qZ0b9v.G2pM5s046bKk6mG3G'; -- Password123!
BEGIN
    -- Obtener Roles
    SELECT id INTO v_rol_admin FROM roles WHERE UPPER(nombre) = 'ADMIN' LIMIT 1;
    SELECT id INTO v_rol_comercio FROM roles WHERE UPPER(nombre) = 'COMERCIO' LIMIT 1;
    SELECT id INTO v_rol_cliente FROM roles WHERE UPPER(nombre) = 'CLIENTE' LIMIT 1;

    -- Obtener Niveles
    SELECT id INTO v_nivel_bronce FROM niveles_pasaporte WHERE LOWER(nombre_rango) = 'bronce' LIMIT 1;
    SELECT id INTO v_nivel_plata FROM niveles_pasaporte WHERE LOWER(nombre_rango) = 'plata' LIMIT 1;

    -- Categorías
    SELECT id INTO v_cat_cafe FROM categorias_establecimiento WHERE nombre LIKE 'Cafeter%' LIMIT 1;
    SELECT id INTO v_cat_rest FROM categorias_establecimiento WHERE nombre LIKE 'Restaurante%' LIMIT 1;

    -- 1. Insertar Usuario Admin (cuentaunicaapk@gmail.com)
    -- Los administradores no participan en gamificación (nivel_id es NULL)
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, estado)
    VALUES (v_user_admin, v_rol_admin, NULL, 'Administrador', 'Principal', 'cuentaunicaapk@gmail.com', v_hash_demo, 0, 0, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO UPDATE 
      SET rol_id = EXCLUDED.rol_id, 
          nivel_id = NULL,
          estado = 'ACTIVO';

    -- 2. Insertar Usuario Personal de Comercio
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, email, password_hash, aceptacion_tyc, estado)
    VALUES (v_user_comercio, v_rol_comercio, v_nivel_bronce, 'María', 'Validadora', 'comercio@cafecentral.com', v_hash_demo, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO NOTHING;

    -- 3. Insertar Usuario Cliente con sellos y puntos acumulados
    INSERT INTO usuarios (id, rol_id, nivel_id, nombres, apellidos, email, password_hash, total_sellos, puntos_globales, aceptacion_tyc, estado)
    VALUES (v_user_cliente, v_rol_cliente, v_nivel_plata, 'Aldair', 'Viajero', 'cliente@demo.com', v_hash_demo, 25, 250, TRUE, 'ACTIVO')
    ON CONFLICT (email) DO NOTHING;

    -- ---------------------------------------------------------------------------------
    -- 2. ESTABLECIMIENTOS ALIADOS
    -- ---------------------------------------------------------------------------------
    INSERT INTO establecimientos (id, categoria_id, ruc, razon_social, direccion, estado)
    VALUES 
    (v_est_cafe, v_cat_cafe, '20100000001', 'Café Central Colonial', 'Calle del Comercio 101, Centro', 'ACTIVO'),
    (v_est_rest, v_cat_rest, '20100000002', 'Restaurante Fusión Criolla', 'Av. Gastronómica 204, Miraflores', 'ACTIVO')
    ON CONFLICT (ruc) DO NOTHING;

    -- Asociar el usuario comercio al establecimiento
    INSERT INTO personal_establecimiento (usuario_id, establecimiento_id, pin_validacion, estado)
    VALUES (v_user_comercio, v_est_cafe, '1234', TRUE)
    ON CONFLICT (usuario_id, establecimiento_id) DO NOTHING;

    -- ---------------------------------------------------------------------------------
    -- 3. REGLAS DE SELLOS POR LOCAL
    -- ---------------------------------------------------------------------------------
    INSERT INTO reglas_sellos (id, establecimiento_id, nombre_accion, valor_puntos_por_sello, limite_diario_por_usuario, estado)
    VALUES 
    (v_regla_cafe, v_est_cafe, 'Consumo en Cafetería', 10, 1, 'ACTIVA'),
    (v_regla_rest, v_est_rest, 'Almuerzo / Cena Carta', 20, 1, 'ACTIVA')
    ON CONFLICT (id) DO NOTHING;

    -- ---------------------------------------------------------------------------------
    -- 4. TARJETA FÍSICA NFC Y QR ASIGNADA AL CLIENTE
    -- ---------------------------------------------------------------------------------
    INSERT INTO tarjetas_nfc (usuario_id, uid_nfc, qr_respaldo, estado, fecha_asignacion)
    VALUES 
    (v_user_cliente, '04:5A:2B:1A:3C:60:80', 'https://pasaporte.nfc/r/045a2b1a3c6080', 'ASIGNADA', CURRENT_TIMESTAMP)
    ON CONFLICT (uid_nfc) DO NOTHING;

    -- ---------------------------------------------------------------------------------
    -- 5. CATÁLOGO DE RECOMPENSAS PARA CANJES
    -- ---------------------------------------------------------------------------------
    INSERT INTO recompensas_plataforma (id, nombre_recompensa, descripcion, costo_puntos_globales, stock_disponible, imagen_url, tipo_entrega, estado)
    VALUES 
    (
        v_rec_cafe,
        'Café Espresso o Americano Doble',
        'Canjea tu café favorito en cualquiera de nuestros locales aliados de Café Central.',
        50,
        150,
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500',
        'LOCAL_ALIADO',
        'ACTIVA'
    ),
    (
        v_rec_postre,
        'Postre Artesanal de la Casa',
        'Elige una porción de postre del día en locales participantes.',
        90,
        80,
        'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500',
        'LOCAL_ALIADO',
        'ACTIVA'
    )
    ON CONFLICT (id) DO NOTHING;

    -- ---------------------------------------------------------------------------------
    -- 6. HISTORIAL DE VISITAS Y SELLOS PREVIOS (Demostración)
    -- ---------------------------------------------------------------------------------
    INSERT INTO historial_visitas_sellos (usuario_id, establecimiento_id, personal_validador_id, regla_sello_id, puntos_ganados, metodo_validacion, fecha_hora)
    VALUES 
    (v_user_cliente, v_est_cafe, v_user_comercio, v_regla_cafe, 10, 'NFC', CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (v_user_cliente, v_est_rest, NULL, v_regla_rest, 20, 'QR', CURRENT_TIMESTAMP - INTERVAL '1 day');

    -- ---------------------------------------------------------------------------------
    -- 7. PUBLICACIONES SOCIALES DE DEMOSTRACIÓN (FEED)
    -- ---------------------------------------------------------------------------------
    INSERT INTO publicaciones (usuario_id, establecimiento_id, texto_contenido, url_media, tipo_media, visibilidad, estado_moderacion)
    VALUES 
    (
        v_user_cliente,
        v_est_cafe,
        '¡Excelente café y ambiente en Café Central Colonial! Primer sello del día obtenido ☕✨',
        'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
        'IMAGEN',
        'PUBLICA',
        'APROBADA'
    );

END $$;
