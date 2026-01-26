import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const API_BASE = `${EXPO_PUBLIC_BACKEND_URL}/api`;

// Status colors
const STATUS_COLORS = {
  SAFE: '#34C759',
  WARNING: '#FFCC00',
  EMERGENCY: '#FF3B30'
};

interface Alert {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
}

interface SystemStatus {
  current_status: string;
  last_updated: string;
  description?: string;
}

interface ConnectionStatus {
  is_connected: boolean;
  last_ping: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [latestAlert, setLatestAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch system status
      const statusRes = await fetch(`${API_BASE}/status`);
      const statusData = await statusRes.json();
      setStatus(statusData);

      // Fetch connection status
      const connRes = await fetch(`${API_BASE}/connection`);
      const connData = await connRes.json();
      setConnection(connData);

      // Fetch latest alert
      const alertRes = await fetch(`${API_BASE}/alerts/latest`);
      const alertData = await alertRes.json();
      setLatestAlert(alertData);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusColor = (statusText: string) => {
    return STATUS_COLORS[statusText as keyof typeof STATUS_COLORS] || '#999999';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = status?.current_status || 'SAFE';
  const statusColor = getStatusColor(currentStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>KreoAssist</Text>
          </View>
          <Text style={styles.subtitle}>Caregiver Monitor</Text>
        </View>

        {/* Connection Status */}
        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <Ionicons
              name={connection?.is_connected ? 'radio' : 'radio-outline'}
              size={20}
              color={connection?.is_connected ? '#34C759' : '#FF3B30'}
            />
            <Text style={[styles.connectionText, {
              color: connection?.is_connected ? '#34C759' : '#FF3B30'
            }]}>
              {connection?.is_connected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {connection?.last_ping && (
            <Text style={styles.lastPingText}>
              Last update: {formatTime(connection.last_ping)}
            </Text>
          )}
        </View>

        {/* System Status */}
        <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
          <Text style={styles.statusLabel}>SYSTEM STATUS</Text>
          <View style={styles.statusContent}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Ionicons
                name={
                  currentStatus === 'SAFE' ? 'checkmark-circle' :
                  currentStatus === 'WARNING' ? 'warning' :
                  'alert-circle'
                }
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.statusText}>{currentStatus}</Text>
            </View>
            {status?.description && (
              <Text style={styles.statusDescription}>{status.description}</Text>
            )}
          </View>
          {status?.last_updated && (
            <Text style={styles.lastUpdated}>
              Updated: {formatDate(status.last_updated)}
            </Text>
          )}
        </View>

        {/* Latest Alert Preview */}
        {latestAlert && (
          <View style={styles.alertPreviewCard}>
            <View style={styles.alertPreviewHeader}>
              <Ionicons name="notifications" size={24} color="#FF3B30" />
              <Text style={styles.alertPreviewTitle}>Active Alert</Text>
            </View>
            <View style={[styles.alertPreviewBadge, {
              backgroundColor: latestAlert.type === 'emergency' ? '#FF3B30' : '#FFCC00'
            }]}>
              <Text style={styles.alertTypeText}>
                {latestAlert.type.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.alertPreviewDescription}>
              {latestAlert.description}
            </Text>
            <Text style={styles.alertTime}>
              {formatDate(latestAlert.timestamp)}
            </Text>
            <TouchableOpacity
              style={styles.viewAlertButton}
              onPress={() => router.push('/alert')}
            >
              <Text style={styles.viewAlertButtonText}>VIEW ALERT</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/events')}
          >
            <Ionicons name="list" size={28} color="#007AFF" />
            <Text style={styles.actionButtonText}>Event Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRefresh}
          >
            <Ionicons name="refresh" size={28} color="#007AFF" />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Testing/Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>Demo Controls (For Testing)</Text>
          <View style={styles.demoButtons}>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#FF3B30' }]}
              onPress={async () => {
                await fetch(`${API_BASE}/simulate/emergency`, { method: 'POST' });
                fetchData();
              }}
            >
              <Text style={styles.demoButtonText}>Simulate Emergency</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#FFCC00' }]}
              onPress={async () => {
                await fetch(`${API_BASE}/simulate/warning`, { method: 'POST' });
                fetchData();
              }}
            >
              <Text style={[styles.demoButtonText, { color: '#000' }]}>Simulate Warning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoButton, { backgroundColor: '#34C759' }]}
              onPress={async () => {
                await fetch(`${API_BASE}/simulate/safe`, { method: 'POST' });
                fetchData();
              }}
            >
              <Text style={styles.demoButtonText}>Set to Safe</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8
  },
  logoContainer: {
    marginBottom: 8
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#5E35B1',
    letterSpacing: 1
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  connectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  connectionText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8
  },
  lastPingText: {
    fontSize: 14,
    color: '#999',
    marginLeft: 28
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 12
  },
  statusContent: {
    alignItems: 'center'
  },
  statusBadge: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minWidth: 200
  },
  statusText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    letterSpacing: 1
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8
  },
  lastUpdated: {
    fontSize: 14,
    color: '#999',
    marginTop: 12,
    textAlign: 'center'
  },
  alertPreviewCard: {
    backgroundColor: '#FFF5F5',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  alertPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  alertPreviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginLeft: 8
  },
  alertPreviewBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  alertTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1
  },
  alertPreviewDescription: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    lineHeight: 24
  },
  alertTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16
  },
  viewAlertButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewAlertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 1
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center'
  },
  demoSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center'
  },
  demoButtons: {
    gap: 12
  },
  demoButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF'
  }
});
