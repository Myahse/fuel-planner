import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fuelgo/main.dart';

void main() {
  testWidgets('FUELGO onboarding renders', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: FuelGoApp()));
    expect(find.textContaining('Know how far'), findsOneWidget);
  });
}
