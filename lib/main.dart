
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest.dart' as tz_data;
import 'package:timezone/timezone.dart' as tz;

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Timezone
  tz_data.initializeTimeZones();

  // Initialize Notifications
  const AndroidInitializationSettings initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  const InitializationSettings initializationSettings = InitializationSettings(android: initializationSettingsAndroid);
  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  // Request Notification Permissions for Android 13+
  await flutterLocalNotificationsPlugin.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();

  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Warning: Could not load .env file: $e");
  }

  try {
    await Firebase.initializeApp(
      options: FirebaseOptions(
        apiKey: dotenv.get('VITE_FIREBASE_API_KEY', fallback: ''),
        appId: dotenv.get('VITE_FIREBASE_APP_ID', fallback: ''),
        messagingSenderId: dotenv.get('VITE_FIREBASE_MESSAGING_SENDER_ID', fallback: ''),
        projectId: dotenv.get('VITE_FIREBASE_PROJECT_ID', fallback: ''),
        storageBucket: dotenv.get('VITE_FIREBASE_STORAGE_BUCKET', fallback: ''),
      ),
    );
  } catch (e) {
    debugPrint("Firebase Initialization Error: $e");
  }

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const SentinelApp());
}

class SentinelApp extends StatelessWidget {
  const SentinelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Sentinel Fleet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate 900
        primaryColor: const Color(0xFFDC2626), // Red 600
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1E1B4B), // Indigo 950
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
            fontSize: 20,
          ),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF1E1B4B),
          selectedItemColor: Color(0xFFDC2626),
          unselectedItemColor: Colors.grey,
        ),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFDC2626),
          secondary: Color(0xFF1E1B4B),
          surface: Color(0xFF1E293B),
        ),
      ),
      home: const MainLayout(),
    );
  }
}

class MainLayout extends StatefulWidget {
  const MainLayout({super.key});

  @override
  State<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends State<MainLayout> {
  int _currentIndex = 0;

  final List<Widget> _pages = [
    const StatusPage(),
    const AddUnitPage(),
    const ReportIncidentPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/logo.png',
              height: 32,
              errorBuilder: (context, error, stackTrace) => const Icon(Icons.airport_shuttle, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('SENTINEL'),
                Text(
                  'FLEET COMMAND',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[400],
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'STATUS',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle_outline),
            activeIcon: Icon(Icons.add_circle),
            label: 'NEW UNIT',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.report_problem_outlined),
            activeIcon: Icon(Icons.report_problem),
            label: 'REPORT',
          ),
        ],
      ),
    );
  }
}

class StatusPage extends StatelessWidget {
  const StatusPage({super.key});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance.collection('cars').snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
        }
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

        final cars = snapshot.data!.docs;
        int count = cars.length;

        // Calculate alerts (Roadtax or Insurance expiring within 1 week)
        List<Map<String, dynamic>> alerts = [];
        for (var doc in cars) {
          final data = doc.data() as Map<String, dynamic>;
          final plate = data['plateNumber'] ?? '???';
          
          _checkDate(data['roadTaxExpiry'], 'Roadtax', plate, alerts, now);
          _checkDate(data['insuranceExpiry'], 'Insurance', plate, alerts, now);
          
          // Service check (3 months)
          if (data['lastServiceDate'] != null) {
            try {
              final lastService = DateFormat('dd/MM/yyyy').parse(data['lastServiceDate']);
              final nextService = lastService.add(const Duration(days: 90));
              if (nextService.isBefore(now.add(const Duration(days: 7)))) {
                alerts.add({
                  'plate': plate,
                  'type': 'Service',
                  'date': DateFormat('dd/MM/yyyy').format(nextService),
                  'isUrgent': nextService.isBefore(now),
                });
              }
            } catch (_) {}
          }
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'LIVE FLEET STATUS',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 2),
              ),
              const SizedBox(height: 20),
              _buildMetricCard(count),
              const SizedBox(height: 30),
              if (alerts.isNotEmpty) ...[
                const Text(
                  'MAINTENANCE ALERTS',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFDC2626), letterSpacing: 2),
                ),
                const SizedBox(height: 12),
                ...alerts.map((alert) => _buildAlertItem(alert)),
              ] else if (count > 0) ...[
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(20),
                    child: Text('All units in good standing', style: TextStyle(color: Colors.grey)),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  void _checkDate(String? dateStr, String type, String plate, List<Map<String, dynamic>> alerts, DateTime now) {
    if (dateStr == null) return;
    try {
      final date = DateFormat('dd/MM/yyyy').parse(dateStr);
      final diff = date.difference(now).inDays;
      if (diff <= 7) {
        alerts.add({
          'plate': plate,
          'type': type,
          'date': dateStr,
          'isUrgent': diff < 0,
        });
      }
    } catch (_) {}
  }

  Widget _buildMetricCard(int count) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        children: [
          const Icon(Icons.monitor_heart, size: 54, color: Color(0xFFDC2626)),
          const SizedBox(height: 16),
          Text(
            '$count Units Active',
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          Text(
            count == 0 ? 'No vehicles currently tracked' : 'Fleet operational',
            style: const TextStyle(color: Colors.grey, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertItem(Map<String, dynamic> alert) {
    final bool isUrgent = alert['isUrgent'] ?? false;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isUrgent ? const Color(0x20DC2626) : const Color(0xFF1E293B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isUrgent ? const Color(0xFFDC2626).withOpacity(0.3) : Colors.white10),
      ),
      child: Row(
        children: [
          Icon(
            isUrgent ? Icons.warning_rounded : Icons.info_outline_rounded,
            color: isUrgent ? const Color(0xFFDC2626) : Colors.orange,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${alert['plate']} - ${alert['type']}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
                Text(
                  isUrgent ? 'EXPIRED on ${alert['date']}' : 'Expires in ${alert['date']}',
                  style: TextStyle(color: Colors.grey[400], fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AddUnitPage extends StatefulWidget {
  const AddUnitPage({super.key});

  @override
  State<AddUnitPage> createState() => _AddUnitPageState();
}

class _AddUnitPageState extends State<AddUnitPage> {
  final _formKey = GlobalKey<FormState>();
  final _plateController = TextEditingController();
  final _modelController = TextEditingController();
  final _colorController = TextEditingController();
  
  final _roadTaxDateController = TextEditingController();
  final _insuranceDateController = TextEditingController();
  final _serviceDateController = TextEditingController();
  final _mileageController = TextEditingController();
  
  String _vehicleType = 'Sedan';

  Future<void> _selectDate(BuildContext context, TextEditingController controller) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFFDC2626),
              onPrimary: Colors.white,
              surface: Color(0xFF1E1B4B),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        controller.text = DateFormat('dd/MM/yyyy').format(picked);
      });
    }
  }

  Future<void> _saveVehicle() async {
    if (_formKey.currentState!.validate()) {
      try {
        final data = {
          'plateNumber': _plateController.text,
          'model': _modelController.text,
          'type': _vehicleType,
          'color': _colorController.text,
          'roadTaxExpiry': _roadTaxDateController.text,
          'insuranceExpiry': _insuranceDateController.text,
          'lastServiceDate': _serviceDateController.text,
          'lastServiceMileage': _mileageController.text,
          'timestamp': FieldValue.serverTimestamp(),
        };

        await FirebaseFirestore.instance.collection('cars').add(data);
        
        // Schedule notifications
        _scheduleExpiryNotification(_plateController.text, 'Roadtax', _roadTaxDateController.text);
        _scheduleExpiryNotification(_plateController.text, 'Insurance', _insuranceDateController.text);

        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Vehicle Registered successfully!'), backgroundColor: Colors.green),
        );
        
        _plateController.clear();
        _modelController.clear();
        _colorController.clear();
        _roadTaxDateController.clear();
        _insuranceDateController.clear();
        _serviceDateController.clear();
        _mileageController.clear();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _scheduleExpiryNotification(String plate, String type, String dateStr) async {
    try {
      final date = DateFormat('dd/MM/yyyy').parse(dateStr);
      final notifyDate = date.subtract(const Duration(days: 7));
      
      if (notifyDate.isAfter(DateTime.now())) {
        final int id = plate.hashCode + type.hashCode;
        
        await flutterLocalNotificationsPlugin.zonedSchedule(
          id,
          'Fleet Alert: $type Expiring',
          '$type for $plate expires in 1 week (${DateFormat('dd/MM').format(date)})',
          tz.TZDateTime.from(notifyDate, tz.local),
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'expiry_alerts',
              'Expiry Alerts',
              importance: Importance.max,
              priority: Priority.high,
            ),
          ),
          androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
          uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        );
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'REGISTER NEW VEHICLE',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 2),
            ),
            const SizedBox(height: 20),
            _buildTextField('Plate Number', _plateController, 'e.g. ABC 1234'),
            _buildTextField('Vehicle Model', _modelController, 'e.g. Toyota Hilux'),
            _buildTypeDropdown(),
            _buildTextField('Car Color', _colorController, 'e.g. Crimson Red'),
            
            const Divider(height: 40, color: Colors.white10),
            const Text('LEGAL & INSURANCE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildDateField('Roadtax Expired Date', _roadTaxDateController)),
                const SizedBox(width: 16),
                Expanded(child: _buildDateField('Insurance Expired Date', _insuranceDateController)),
              ],
            ),
            
            const SizedBox(height: 20),
            const Text('MAINTENANCE (Every 3 Months)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: _buildDateField('Last Service Date', _serviceDateController)),
                const SizedBox(width: 16),
                Expanded(child: _buildTextField('Last Service Mileage', _mileageController, 'KM', isPhone: true)),
              ],
            ),

            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _saveVehicle,
                child: const Text('SAVE VEHICLE', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.2)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, String hint, {bool isPhone = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            keyboardType: isPhone ? TextInputType.number : TextInputType.text,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.grey),
              fillColor: const Color(0xFF1E293B),
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
            validator: (value) => value!.isEmpty ? 'Required' : null,
          ),
        ],
      ),
    );
  }

  Widget _buildDateField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            readOnly: true,
            onTap: () => _selectDate(context, controller),
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'dd/mm/yyyy',
              hintStyle: const TextStyle(color: Colors.grey),
              fillColor: const Color(0xFF1E293B),
              filled: true,
              suffixIcon: const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
            ),
            validator: (value) => value!.isEmpty ? 'Select Date' : null,
          ),
        ],
      ),
    );
  }

  Widget _buildTypeDropdown() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Vehicle Type', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _vehicleType,
                isExpanded: true,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                items: ['Sedan', 'SUV', 'Truck', 'Van', 'Motorcycle'].map((String value) {
                  return DropdownMenuItem<String>(value: value, child: Text(value));
                }).toList(),
                onChanged: (val) => setState(() => _vehicleType = val!),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class ReportIncidentPage extends StatefulWidget {
  const ReportIncidentPage({super.key});

  @override
  State<ReportIncidentPage> createState() => _ReportIncidentPageState();
}

class _ReportIncidentPageState extends State<ReportIncidentPage> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedCarId;
  String _incidentType = 'Accident';
  String _severity = 'Medium';
  final _dateController = TextEditingController();
  final _descController = TextEditingController();

  Future<void> _submitReport() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedCarId == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a vehicle')));
        return;
      }
      
      try {
        await FirebaseFirestore.instance.collection('incidents').add({
          'carId': _selectedCarId,
          'type': _incidentType,
          'severity': _severity,
          'date': _dateController.text,
          'description': _descController.text,
          'status': 'OPEN',
          'timestamp': FieldValue.serverTimestamp(),
        });
        
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Incident Report Submitted!'), backgroundColor: Colors.green),
        );
        
        _dateController.clear();
        _descController.clear();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _shareWhatsApp() async {
    final text = Uri.encodeComponent(
      "*INCIDENT REPORT*\n\n*Type:* $_incidentType\n*Severity:* $_severity\n*Date:* ${_dateController.text}\n*Description:* ${_descController.text}"
    );
    final url = Uri.parse("https://wa.me/?text=$text");
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch WhatsApp')));
    }
  }

  Future<void> _shareEmail() async {
    final subject = Uri.encodeComponent("Incident Report: $_incidentType");
    final body = Uri.encodeComponent(
      "Type: $_incidentType\nSeverity: $_severity\nDate: ${_dateController.text}\nDescription: ${_descController.text}"
    );
    final url = Uri.parse("mailto:?subject=$subject&body=$body");
    if (!await launchUrl(url)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch Email')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'REPORT INCIDENT',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 2),
            ),
            const SizedBox(height: 20),
            
            StreamBuilder<QuerySnapshot>(
              stream: FirebaseFirestore.instance.collection('cars').snapshots(),
              builder: (context, snapshot) {
                List<DropdownMenuItem<String>> items = [];
                if (snapshot.hasData) {
                  items = snapshot.data!.docs.map((doc) {
                    final data = doc.data() as Map<String, dynamic>;
                    return DropdownMenuItem(
                      value: doc.id,
                      child: Text(data['plateNumber'] ?? 'Unknown'),
                    );
                  }).toList();
                }
                
                return _buildDropdownRow('Affected Vehicle', items, _selectedCarId, (val) => setState(() => _selectedCarId = val));
              }
            ),

            Row(
              children: [
                Expanded(child: _buildSimpleDropdown('Type', ['Accident', 'Breakdown', 'Damage', 'Maintenance', 'Other'], _incidentType, (val) => setState(() => _incidentType = val!))),
                const SizedBox(width: 16),
                Expanded(child: _buildSimpleDropdown('Severity', ['Low', 'Medium', 'High', 'Critical'], _severity, (val) => setState(() => _severity = val!))),
              ],
            ),
            _buildTextField('Date of Incident (d/m/y)', _dateController, 'Select Date', isDate: true),
            _buildTextField('Description of Damage', _descController, 'Describe what happened...', maxLines: 4),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFDC2626),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _submitReport,
                child: const Text('SUBMIT TO FLEET COMMAND', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
            const SizedBox(height: 30),
            const Center(
              child: Text(
                'SUBMIT EXTERNALLY',
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildExternalButton(
                    'WhatsApp',
                    const Color(0xFF16A34A),
                    FontAwesomeIcons.whatsapp,
                    _shareWhatsApp,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildExternalButton(
                    'Email',
                    const Color(0xFFE2E8F0),
                    Icons.email_outlined,
                    _shareEmail,
                    textColor: Colors.black,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, String hint, {int maxLines = 1, bool isDate = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          TextFormField(
            controller: controller,
            maxLines: maxLines,
            readOnly: isDate,
            onTap: isDate ? () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: DateTime.now(),
                firstDate: DateTime(2000),
                lastDate: DateTime(2100),
              );
              if (picked != null) {
                controller.text = DateFormat('dd/MM/yyyy').format(picked);
              }
            } : null,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: Colors.grey),
              fillColor: const Color(0xFF1E293B),
              filled: true,
              suffixIcon: isDate ? const Icon(Icons.calendar_today, size: 16, color: Colors.grey) : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdownRow(String label, List<DropdownMenuItem<String>> items, String? current, Function(String?) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: current,
                isExpanded: true,
                hint: const Text('Select Vehicle', style: TextStyle(color: Colors.grey)),
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                items: items,
                onChanged: onChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSimpleDropdown(String label, List<String> items, String current, Function(String?) onChanged) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: current,
                isExpanded: true,
                dropdownColor: const Color(0xFF1E293B),
                style: const TextStyle(color: Colors.white),
                items: items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
                onChanged: onChanged,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExternalButton(String label, Color color, IconData icon, VoidCallback onPressed, {Color textColor = Colors.white}) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        height: 60,
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FaIcon(icon, color: textColor, size: 20),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: textColor, fontWeight: FontWeight.bold, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
