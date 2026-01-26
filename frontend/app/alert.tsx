import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert as RNAlert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_BASE = `${EXPO_PUBLIC_BACKEND_URL}/api`;

interface Alert {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

export default function AlertScreen() {
  const router = useRouter();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);

  useEffect(() => {
    fetchLatestAlert();
  }, []);

  const fetchLatestAlert = async () => {
    try {
      const response = await fetch(`${API_BASE}/alerts/latest`);
      const data = await response.json();
      setAlert(data);
    } catch (error) {
      console.error('Error fetching alert:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!alert) return;

    setAcknowledging(true);
    try {
      const response = await fetch(`${API_BASE}/alerts/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ alert_id: alert.id })
      });

      if (response.ok) {
        RNAlert.alert(
          'Alert Acknowledged',
          'The alert has been marked as acknowledged.',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      RNAlert.alert('Error', 'Failed to acknowledge alert');
    } finally {
      setAcknowledging(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.loadingText}>Loading alert...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!alert) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Alert Details</Text>
        </View>
        <View style={styles.noAlertContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#34C759" />
          <Text style={styles.noAlertTitle}>No Active Alerts</Text>
          <Text style={styles.noAlertText}>
            All alerts have been acknowledged.
          </Text>
          <TouchableOpacity
            style={styles.backHomeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backHomeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isEmergency = alert.type === 'emergency';
  const alertColor = isEmergency ? '#FF3B30' : '#FFCC00';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isEmergency ? '#FFF5F5' : '#FFFEF5' }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={alertColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: alertColor }]}>Alert Details</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Alert Icon */}
        <View style={styles.alertIconContainer}>
          <View style={[styles.alertIconCircle, { backgroundColor: alertColor }]}>
            <Ionicons
              name={isEmergency ? 'alert-circle' : 'warning'}
              size={80}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Alert Type Badge */}
        <View style={[styles.alertTypeBadge, { backgroundColor: alertColor }]}>
          <Text style={styles.alertTypeText}>
            {alert.type.toUpperCase()} ALERT
          </Text>
        </View>

        {/* Alert Message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>MESSAGE</Text>
          <Text style={styles.messageText}>{alert.description}</Text>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampCard}>
          <Ionicons name="time" size={20} color="#666" />
          <View style={styles.timestampContent}>
            <Text style={styles.timestampLabel}>Triggered at</Text>
            <Text style={styles.timestampText}>
              {formatDateTime(alert.timestamp)}
            </Text>
          </View>
        </View>

        {/* Emergency Instructions */}
        {isEmergency && (
          <View style={styles.instructionsCard}>
            <View style={styles.instructionsHeader}>
              <Ionicons name="information-circle" size={24} color="#FF3B30" />
              <Text style={styles.instructionsTitle}>Emergency Response</Text>
            </View>
            <Text style={styles.instructionsText}>
              1. Verify the alert is genuine{`\n`}
              2. Contact the person immediately{`\n`}
              3. If unable to reach, consider emergency services{`\n`}
              4. Check device location (when feature is available)
            </Text>
          </View>
        )}

        {/* Acknowledge Button */}
        <TouchableOpacity
          style={[styles.acknowledgeButton, { backgroundColor: alertColor }]}
          onPress={handleAcknowledge}
          disabled={acknowledging}
        >
          {acknowledging ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.acknowledgeButtonText}>ACKNOWLEDGE ALERT</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          Note: Acknowledging this alert will mark it as seen in your local app only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5'
  },
  backButton: {
    padding: 8,
    marginRight: 12
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  noAlertContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  noAlertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    marginTop: 16,
    marginBottom: 8
  },
  noAlertText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24
  },
  backHomeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10
  },
  backHomeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  alertIconContainer: {
    marginBottom: 24
  },
  alertIconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  alertTypeBadge: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 24
  },
  alertTypeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2
  },
  messageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12
  },
  messageText: {
    fontSize: 20,
    color: '#333',
    lineHeight: 28
  },
  timestampCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  timestampContent: {
    marginLeft: 12,
    flex: 1
  },
  timestampLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4
  },
  timestampText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500'
  },
  instructionsCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FF3B30'
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24
  },
  acknowledgeButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    letterSpacing: 1
  },
  noteText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 16
  }
});
