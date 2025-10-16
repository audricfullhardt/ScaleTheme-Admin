import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import React, { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) setExpoPushToken(token);
    });

    // Listener pour les notifications reçues
    const subscriptionReceived = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listener quand l'utilisateur interagit avec la notif
    const subscriptionResponse =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "Notification ouverte :",
          response.notification.request.content
        );
      });

    return () => {
      subscriptionReceived.remove();
      subscriptionResponse.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ScaleTheme Admin</Text>

      <Text style={styles.label}>Expo Push Token :</Text>
      <Text style={styles.token}>{expoPushToken ?? "Chargement..."}</Text>

      {notification && (
        <View style={styles.notificationBox}>
          <Text style={styles.notificationTitle}>
            🔔 {notification.request.content.title}
          </Text>
          <Text>{notification.request.content.body}</Text>
        </View>
      )}
    </View>
  );
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    alert(
      "Les notifications push ne fonctionnent pas sur un simulateur iOS. Teste sur un vrai iPhone."
    );
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    alert("Permission de notifications refusée !");
    return null;
  }

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  console.log("Expo Push Token :", token);

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
  },
  token: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    color: "#666",
  },
  notificationBox: {
    marginTop: 20,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    width: "100%",
  },
  notificationTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
});
