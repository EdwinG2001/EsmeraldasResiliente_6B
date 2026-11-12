import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../../models/censo_familia_model.dart';
import '../../models/incidente_model.dart';

class LocalDatabaseService {
  static final LocalDatabaseService _instance = LocalDatabaseService._internal();
  factory LocalDatabaseService() => _instance;

  static Database? _database;

  // Memoria auxiliar para compatibilidad Web (Edge / Chrome)
  final List<CensoFamiliaModel> _webCensoMemory = [];
  final List<IncidenteModel> _webIncidentesMemory = [];

  LocalDatabaseService._internal();

  Future<Database?> get database async {
    if (kIsWeb) return null; // En Web no se inicializa sqlite binario nativo
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'esmeraldas_resiliente_local.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Tabla para almacenamiento offline de fichas censales
    await db.execute('''
      CREATE TABLE censo_offline (
        id TEXT PRIMARY KEY,
        codigo_censo TEXT,
        jefe_familia_nombre TEXT,
        jefe_familia_cedula TEXT,
        telefono_contacto TEXT,
        canton TEXT,
        parroquia TEXT,
        barrio_sector TEXT,
        direccion_referencia TEXT,
        lat REAL,
        lon REAL,
        numero_integrantes INTEGER,
        ninos_menores_5 INTEGER,
        adultos_mayores INTEGER,
        personas_discapacidad INTEGER,
        danos_vivienda TEXT,
        requiere_evacuacion_inmediata INTEGER,
        fecha_censo TEXT,
        is_synced INTEGER DEFAULT 0
      )
    ''');

    // Tabla para almacenamiento offline de incidentes y emergencias ciudadanas
    await db.execute('''
      CREATE TABLE incidentes_offline (
        id TEXT PRIMARY KEY,
        tipo_evento TEXT,
        nivel_gravedad TEXT,
        descripcion TEXT,
        lat REAL,
        lon REAL,
        precision_gps_metros REAL,
        personas_atrapadas INTEGER,
        familias_afectadas INTEGER,
        estimacion_danos_vivienda TEXT,
        estado TEXT,
        es_simulacion INTEGER,
        sincronizado_offline INTEGER,
        fecha_incidente TEXT,
        fotos TEXT
      )
    ''');
  }

  // ================= CENSO OFFLINE =================

  Future<int> insertCenso(CensoFamiliaModel familia) async {
    if (kIsWeb) {
      _webCensoMemory.removeWhere((c) => c.id == familia.id);
      _webCensoMemory.add(familia);
      return 1;
    }
    final db = await database;
    return await db!.insert(
      'censo_offline',
      familia.toSqliteMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<CensoFamiliaModel>> getUnsyncedCensos() async {
    if (kIsWeb) {
      return _webCensoMemory.where((c) => !c.isSynced).toList();
    }
    final db = await database;
    final List<Map<String, dynamic>> maps = await db!.query(
      'censo_offline',
      where: 'is_synced = ?',
      whereArgs: [0],
      orderBy: 'fecha_censo DESC',
    );
    return maps.map((map) => CensoFamiliaModel.fromSqliteMap(map)).toList();
  }

  Future<int> getUnsyncedCensosCount() async {
    if (kIsWeb) {
      return _webCensoMemory.where((c) => !c.isSynced).length;
    }
    final db = await database;
    final res = await db!.rawQuery('SELECT COUNT(*) as cnt FROM censo_offline WHERE is_synced = 0');
    return Sqflite.firstIntValue(res) ?? 0;
  }

  Future<int> markCensoSynced(String id) async {
    if (kIsWeb) {
      final index = _webCensoMemory.indexWhere((c) => c.id == id);
      if (index != -1) {
        // Marcado como sincronizado
        _webCensoMemory.removeAt(index);
      }
      return 1;
    }
    final db = await database;
    return await db!.update(
      'censo_offline',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteCenso(String id) async {
    if (kIsWeb) {
      _webCensoMemory.removeWhere((c) => c.id == id);
      return 1;
    }
    final db = await database;
    return await db!.delete(
      'censo_offline',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // ================= INCIDENTES OFFLINE =================

  Future<int> insertIncidente(IncidenteModel incidente) async {
    if (kIsWeb) {
      _webIncidentesMemory.removeWhere((i) => i.id == incidente.id);
      _webIncidentesMemory.add(incidente);
      return 1;
    }
    final db = await database;
    return await db!.insert(
      'incidentes_offline',
      incidente.toSqliteMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<List<IncidenteModel>> getUnsyncedIncidentes() async {
    if (kIsWeb) {
      return _webIncidentesMemory.where((i) => !i.sincronizadoOffline).toList();
    }
    final db = await database;
    final List<Map<String, dynamic>> maps = await db!.query(
      'incidentes_offline',
      where: 'sincronizado_offline = ?',
      whereArgs: [0],
    );
    return maps.map((map) => IncidenteModel.fromSqliteMap(map)).toList();
  }

  Future<int> markIncidenteSynced(String id) async {
    if (kIsWeb) {
      final index = _webIncidentesMemory.indexWhere((i) => i.id == id);
      if (index != -1) {
        _webIncidentesMemory.removeAt(index);
      }
      return 1;
    }
    final db = await database;
    return await db!.update(
      'incidentes_offline',
      {'sincronizado_offline': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}
