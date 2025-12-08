'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import Image from "next/image";

const translations = {
  fi: {
    title: "Oma profiili",
    userInfo: "Käyttäjätiedot",
    name: "Nimi",
    email: "Sähköposti",
    myRides: "Omat kyydit",
    pendingBookings: "Odottavat varauskyselyt",
    noPendingBookings: "Sinulla ei ole odottavia varauskyselyjä.",
    noRides: "Et ole vielä lisännyt kyytejä.",
    bookedRides: "Varaamani kyydit",
    noBookedRides: "Et ole vielä varannut kyytejä.",
    accept: "Hyväksy",
    reject: "Hylkää",
    delete: "Poista",
    profilePicture: "Profiilikuva",
    addProfilePicture: "Lisää profiilikuva",
    selectImage: "Valitse kuva",
    uploading: "Ladataan...",
    rideDeleted: "Kyyti poistettu onnistuneesti!",
    bookingAccepted: "Varaus hyväksytty!",
    bookingRejected: "Varaus hylätty.",
    loading: "Ladataan profiilia...",
    signInRequired: "Kirjaudu sisään nähdäksesi profiilisi.",
    driver: "Kuski",
    statusPending: "Odottaa vahvistusta",
    statusAccepted: "Hyväksytty",
    statusRejected: "Hylätty",
    manageBookings: "Hallinnoi varauksia",
    bio: "Esittely",
    noBio: "Et ole vielä kirjoittanut esittelyä.",
    editBio: "Muokkaa esittelyä",
    addBio: "Lisää esittely",
    save: "Tallenna",
    cancel: "Peruuta",
    viewProfile: "Katso profiili",
    riderLabel: "Matkustaja",
    riderProfileTitle: "Matkustajan profiili",
    driverRating: "Kuljettajan arvio",
    ratingUnavailable: "Ei arvioita vielä",
    bioSaved: "Esittely tallennettu!",
    profileUpdated: "Profiili päivitetty!",
    profilePictureError: "Profiilikuvan tallennus epäonnistui.",
    profileUpdateError: "Profiilin päivitys epäonnistui.",
    messages: "Keskustelut",
    noMessages: "Sinulla ei ole vielä keskusteluja.",
    chatTitle: "Keskustelu",
    chatPlaceholder: "Kirjoita viesti...",
    chatSend: "Lähetä",
    chatEmpty: "Ei viestejä vielä.",
    chatLoading: "Ladataan viestejä...",
    chatError: "Keskustelua ei voitu avata.",
    chatYou: "Sinä",
    chatOpen: "Avaa chat",
    unknownUser: "Tuntematon käyttäjä",
    close: "Sulje",
  },
  en: {
    title: "My Profile",
    userInfo: "User Information",
    name: "Name",
    email: "Email",
    myRides: "My Rides",
    pendingBookings: "Pending Booking Requests",
    noPendingBookings: "You have no pending booking requests.",
    noRides: "You haven't added any rides yet.",
    bookedRides: "Booked Rides",
    noBookedRides: "You haven't booked any rides yet.",
    accept: "Accept",
    reject: "Reject",
    delete: "Delete",
    profilePicture: "Profile Picture",
    addProfilePicture: "Add Profile Picture",
    selectImage: "Select Image",
    uploading: "Uploading...",
    rideDeleted: "Ride deleted successfully!",
    bookingAccepted: "Booking accepted!",
    bookingRejected: "Booking rejected.",
    loading: "Loading profile...",
    signInRequired: "Sign in to view your profile.",
    driver: "Driver",
    statusPending: "Awaiting confirmation",
    statusAccepted: "Accepted",
    statusRejected: "Rejected",
    manageBookings: "Manage bookings",
    bio: "Bio",
    noBio: "You haven't written a bio yet.",
    editBio: "Edit bio",
    addBio: "Add bio",
    save: "Save",
    cancel: "Cancel",
    viewProfile: "View profile",
    riderLabel: "Rider",
    riderProfileTitle: "Rider profile",
    driverRating: "Driver rating",
    ratingUnavailable: "No ratings yet",
    bioSaved: "Bio saved!",
    profileUpdated: "Profile updated!",
    profilePictureError: "Saving the profile picture failed.",
    profileUpdateError: "Updating the profile failed.",
    messages: "Messages",
    noMessages: "You have no conversations yet.",
    chatTitle: "Chat",
    chatPlaceholder: "Write a message...",
    chatSend: "Send",
    chatEmpty: "No messages yet.",
    chatLoading: "Loading messages...",
    chatError: "Unable to open chat.",
    chatYou: "You",
    chatOpen: "Open chat",
    unknownUser: "Unknown user",
    close: "Close",
  },
  sv: {
    title: "Min Profil",
    userInfo: "Användarinformation",
    name: "Namn",
    email: "E-post",
    myRides: "Mina Skjutsar",
    pendingBookings: "Väntande Bokningsförfrågningar",
    noPendingBookings: "Du har inga väntande bokningsförfrågningar.",
    noRides: "Du har inte lagt till några skjutsar än.",
    bookedRides: "Bokade Skjutsar",
    noBookedRides: "Du har inte bokat några skjutsar än.",
    accept: "Acceptera",
    reject: "Avslå",
    delete: "Ta bort",
    profilePicture: "Profilbild",
    addProfilePicture: "Lägg till Profilbild",
    selectImage: "Välj Bild",
    uploading: "Laddar upp...",
    rideDeleted: "Skjutsen raderad!",
    bookingAccepted: "Bokning accepterad!",
    bookingRejected: "Bokning avslagna.",
    loading: "Laddar profil...",
    signInRequired: "Logga in för att se din profil.",
    driver: "Förare",
    statusPending: "Väntar på svar",
    statusAccepted: "Accepterad",
    statusRejected: "Avslagen",
    manageBookings: "Hantera bokningar",
    bio: "Presentation",
    noBio: "Du har inte skrivit någon presentation än.",
    editBio: "Redigera presentation",
    addBio: "Lägg till presentation",
    save: "Spara",
    cancel: "Avbryt",
    viewProfile: "Visa profil",
    riderLabel: "Passagerare",
    riderProfileTitle: "Passagerarprofil",
    driverRating: "Föraromdöme",
    ratingUnavailable: "Inga omdömen ännu",
    bioSaved: "Presentation sparad!",
    profileUpdated: "Profil uppdaterad!",
    profilePictureError: "Misslyckades att spara profilbilden.",
    profileUpdateError: "Misslyckades att uppdatera profilen.",
    messages: "Chattar",
    noMessages: "Du har inga konversationer ännu.",
    chatTitle: "Chatt",
    chatPlaceholder: "Skriv ett meddelande...",
    chatSend: "Skicka",
    chatEmpty: "Inga meddelanden ännu.",
    chatLoading: "Laddar meddelanden...",
    chatError: "Kunde inte öppna chatten.",
    chatYou: "Du",
    chatOpen: "Öppna chatt",
    unknownUser: "Okänd användare",
    close: "Stäng",
  },
};

interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ConversationSummary {
  id: string;
  rideId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  partner?: {
    id: string;
    name?: string | null;
    email?: string | null;
    profilePictureData?: string | null;
  } | null;
  ride?: {
    id?: string;
    from_city?: string | null;
    to_city?: string | null;
    departure?: string | null;
    price_eur?: number | null;
  } | null;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  } | null;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface ActiveChat {
  conversationId: string;
  partnerId: string;
  partnerName: string;
  partnerEmail?: string | null;
  partnerPicture?: string | null;
  rideId?: string | null;
}

type BookingStatus = "pending" | "accepted" | "rejected";

interface BookingRideSummary {
  id?: string;
  from_city?: string | null;
  to_city?: string | null;
  departure?: string | null;
  price_eur?: number | null;
  driver_name?: string | null;
}

interface BookingEntry {
  id: string;
  created_at: string;
  ride_id?: string | null;
  status: BookingStatus | string;
  ride?: BookingRideSummary | null;
}

interface RiderProfileSummary {
  id?: string;
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  profilePictureData?: string | null;
  driverRating?: number | null;
  driverRatingCount?: number | null;
}

interface PendingBookingEntry extends BookingEntry {
  user_email?: string | null;
  rider?: RiderProfileSummary | null;
}

interface SupabaseRideRow {
  id: string;
  from_city?: string | null;
  to_city?: string | null;
  departure?: string | null;
  price_eur?: number | null;
  seats?: number | null;
  owner?: string | null;
  car?: string | null;
  options?: unknown;
  driver_name?: string | null;
  driver_rating?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  route_polyline?: string | null;
  stops?: unknown;
}

type SessionUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export default function ProfilePage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] || 'fi') as keyof typeof translations;
  const t = translations[locale] || translations.en;

  const router = useRouter();
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error("❌ Supabase ympäristömuuttujat puuttuvat tai ovat virheellisiä!");
  }
  const { data: session, status } = useSession();
  const sessionUser = (session?.user ?? null) as SessionUser | null;
  const sessionUserId = sessionUser?.id ?? sessionUser?.email ?? null;
  const sessionUserName = sessionUser?.name ?? null;
  const sessionUserEmail = sessionUser?.email ?? null;
  const [user, setUser] = useState<User | null>(null);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingEntry[]>([]);
  const [pendingBookings, setPendingBookings] = useState<PendingBookingEntry[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [selectedRiderProfile, setSelectedRiderProfile] = useState<RiderProfileSummary | null>(null);
  const [showRiderProfileModal, setShowRiderProfileModal] = useState(false);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const currentUserId = sessionUserId;
  const activeConversationDetails = activeChat
    ? conversations.find((conversation) => conversation.id === activeChat.conversationId)
    : null;

  const bookingStatusBadges: Record<string, { label: string; className: string }> = {
    pending: {
      label: t.statusPending,
      className: "bg-amber-100/80 text-amber-800 border border-amber-200",
    },
    accepted: {
      label: t.statusAccepted,
      className: "bg-emerald-100/80 text-emerald-700 border border-emerald-200",
    },
    rejected: {
      label: t.statusRejected,
      className: "bg-rose-100/80 text-rose-700 border border-rose-200",
    },
  };

  const getProfileAltText = (name?: string | null, email?: string | null, fallback?: string) => {
    const trimmedName = name?.trim();
    if (trimmedName) {
      return trimmedName;
    }
    const trimmedEmail = email?.trim();
    if (trimmedEmail) {
      return trimmedEmail;
    }
    return fallback ?? t.unknownUser;
  };

  const formatBookingDate = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleDateString(locale);
  };

  const formatRideDateTime = (value?: string | null) => {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const separator = locale === "fi" ? "klo " : locale === "sv" ? "kl. " : "at ";
    const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return `${date.toLocaleDateString(locale)} ${separator}${time}`;
  };

  const sortConversationList = useCallback((items: ConversationSummary[]) => {
    return [...items].sort((a, b) => {
      const parseTime = (entry: ConversationSummary) => {
        const candidate = entry.lastMessage?.createdAt ?? entry.updatedAt ?? entry.createdAt ?? "";
        const millis = candidate ? new Date(candidate).getTime() : 0;
        return Number.isFinite(millis) ? millis : 0;
      };
      return parseTime(b) - parseTime(a);
    });
  }, []);

  const scrollChatToBottom = useCallback(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const formatMessageTimestamp = useCallback(
    (value?: string | null) => {
      if (!value) {
        return "";
      }
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return "";
      }
      const now = new Date();
      const sameDay =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();
      const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
      return sameDay ? time : `${date.toLocaleDateString(locale)} ${time}`;
    },
    [locale]
  );

  const updateConversationWithMessage = useCallback(
    (conversationId: string, message: ChatMessage) => {
      setConversations((prev) => {
        const exists = prev.some((conversation) => conversation.id === conversationId);
        if (!exists) {
          return prev;
        }
        const updated = prev.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                lastMessage: message,
                updatedAt: message.createdAt,
              }
            : conversation
        );
        return sortConversationList(updated);
      });
    },
    [sortConversationList]
  );

  const fetchConversations = useCallback(
    async (withSpinner = true) => {
      if (!session?.user) {
        return;
      }
      if (withSpinner) {
        setIsLoadingConversations(true);
      }
      try {
        const response = await fetch("/api/chat/conversations");
        if (!response.ok) {
          throw new Error("Failed to load conversations");
        }
        const data: ConversationSummary[] = await response.json();
        setConversations(sortConversationList(data));
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (withSpinner) {
          setNotificationType("error");
          setNotificationMessage(t.chatError);
          setTimeout(() => setNotificationMessage(null), 3000);
        }
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [session, sortConversationList, t.chatError]
  );

  const fetchChatMessages = useCallback(
    async (conversationId: string, showSpinner = true) => {
      if (!conversationId) {
        return;
      }
      if (showSpinner) {
        setIsChatLoading(true);
      }
      try {
        const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
        if (!response.ok) {
          throw new Error("Failed to load messages");
        }
        const data: ChatMessage[] = await response.json();
        setChatMessages(data);
        const latest = data[data.length - 1];
        if (latest) {
          updateConversationWithMessage(conversationId, latest);
        }
        requestAnimationFrame(scrollChatToBottom);
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        setNotificationType("error");
        setNotificationMessage(t.chatError);
        setTimeout(() => setNotificationMessage(null), 3000);
      } finally {
        if (showSpinner) {
          setIsChatLoading(false);
        }
      }
    },
    [scrollChatToBottom, t.chatError, updateConversationWithMessage]
  );

  const handleOpenChatFromList = useCallback(
    async (conversation: ConversationSummary) => {
      if (!conversation) {
        return;
      }

      const partnerName = conversation.partner?.name || conversation.partner?.email || t.unknownUser;

      setActiveChat({
        conversationId: conversation.id,
        partnerId: conversation.partner?.id || conversation.partner?.email || "",
        partnerName,
        partnerEmail: conversation.partner?.email ?? null,
        partnerPicture: conversation.partner?.profilePictureData ?? null,
        rideId: conversation.rideId ?? conversation.ride?.id ?? null,
      });

      setChatMessages([]);
      setChatInput("");
      setIsChatLoading(true);

      await fetchChatMessages(conversation.id, false);
      setIsChatLoading(false);
      requestAnimationFrame(scrollChatToBottom);
    },
    [fetchChatMessages, scrollChatToBottom, t.unknownUser]
  );

  const handleCloseChat = useCallback(() => {
    setActiveChat(null);
    setChatMessages([]);
    setChatInput("");
    setIsChatLoading(false);
    setIsSendingChat(false);
  }, []);

  const handleSendChatMessage = useCallback(async () => {
    if (!activeChat) {
      return;
    }

    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    setChatInput("");
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeChat.conversationId,
          content: trimmed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessage: ChatMessage = await response.json();
      setChatMessages((prev) => [...prev, newMessage]);
      updateConversationWithMessage(activeChat.conversationId, newMessage);
      requestAnimationFrame(scrollChatToBottom);
    } catch (error) {
      console.error("Error sending message:", error);
      setNotificationType("error");
      setNotificationMessage(t.chatError);
      setChatInput(trimmed);
      setTimeout(() => setNotificationMessage(null), 3000);
    } finally {
      setIsSendingChat(false);
    }
  }, [activeChat, chatInput, scrollChatToBottom, t.chatError, updateConversationWithMessage]);

  // Hae käyttäjän tiedot ja kyydit Supabasen kautta
  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status === "unauthenticated" && !session) {
      setTimeout(() => router.push("/auth/login"), 200);
      return;
    }

  const userId = sessionUserId;

    console.log("Session:", session);
    console.log("Status:", status);

    const fetchProfileData = async () => {
      setLoading(true);

      setUser({
        id: userId ?? "tuntematon",
        name: sessionUserName ?? "Tuntematon käyttäjä",
        email: sessionUserEmail ?? "",
      });

      let fallbackPicture: string | null = null;
      if (userId) {
        const savedPicture = localStorage.getItem(`profilePicture_${userId}`);
        if (savedPicture) {
          fallbackPicture = savedPicture;
          setProfilePicture(savedPicture);
        }
      }

      try {
        const profileResponse = await fetch("/api/profile", { cache: "no-store" });
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setBio(typeof profileData.bio === "string" ? profileData.bio : "");
          if (profileData.profilePictureData) {
            setProfilePicture(profileData.profilePictureData);
            if (userId) {
              localStorage.setItem(`profilePicture_${userId}`, profileData.profilePictureData);
            }
          } else if (!profileData.profilePictureData && fallbackPicture) {
            setProfilePicture(fallbackPicture);
          }
        } else {
          setBio("");
        }
      } catch (error) {
        console.error("Error fetching profile details:", error);
        setBio("");
      }

      try {
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        const rideRes = await supabase
          .from("rides")
          .select("id, from_city, to_city, departure, seats, price_eur")
          .eq("owner", userId ?? "");

        if (rideRes.error) {
          if (rideRes.error.message.includes("Failed to fetch") || rideRes.error.message.includes("Load failed")) {
            console.warn("🌐 Supabase-yhteys epäonnistui – tarkista CORS-asetukset.");
            setRides([]);
            // Remove any existing toast message
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();
            const corsWarning = document.createElement("div");
            corsWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
            corsWarning.textContent = "Ei saatu yhteyttä tietokantaan. Tarkista asetukset tai yritä uudelleen.";
            document.body.appendChild(corsWarning);
            setTimeout(() => corsWarning.remove(), 5000);
          } else {
            console.error("Virhe haettaessa kyytejä:", rideRes.error.message);
          }
        } else if (rideRes.data) {
          if (rideRes.data.length === 0) {
            setRides([]);
            // Remove any existing toast message
            const existingToast = document.querySelector('.toast-message');
            if (existingToast) existingToast.remove();
            const noRidesWarning = document.createElement("div");
            noRidesWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
            noRidesWarning.textContent = "Ei lisättyjä kyytejä vielä";
            document.body.appendChild(noRidesWarning);
            setTimeout(() => noRidesWarning.remove(), 5000);
          } else {
            const ridesData = rideRes.data as SupabaseRideRow[];
            const mappedRides: Ride[] = ridesData.map((ride) => {
              const departureDate = ride.departure ? new Date(ride.departure) : null;
              const hasValidDeparture = !!(departureDate && !Number.isNaN(departureDate.getTime()));
              const formattedDate = hasValidDeparture ? departureDate.toLocaleDateString("fi-FI") : "";
              const formattedTime = hasValidDeparture
                ? departureDate.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })
                : "";
              return {
                id: ride.id,
                from: ride.from_city ?? "",
                to: ride.to_city ?? "",
                date: formattedDate,
                time: formattedTime,
                price: ride.price_eur ?? 0,
              };
            });
            setRides(mappedRides);
          }
        }
      } catch (err) {
        console.error("❌ Supabase-yhteysvirhe:", err);
        // Remove any existing toast message
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) existingToast.remove();
        const corsWarning = document.createElement("div");
        corsWarning.className = "toast-message fixed bottom-4 right-4 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg animate-fadeIn z-50";
        corsWarning.textContent = "Virhe muodostettaessa yhteyttä Supabaseen. Tarkista ympäristömuuttujat.";
        document.body.appendChild(corsWarning);
        setTimeout(() => corsWarning.remove(), 5000);
      }

      try {
        const response = await fetch("/api/bookings");
        if (response.ok) {
          const bookingsData = (await response.json()) as BookingEntry[];
          console.log("Bookings fetched from API:", bookingsData);
          setBookings(bookingsData);
        } else {
          const status = response.status;
          console.error("Error fetching bookings: HTTP", status);
          setBookings([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching bookings:", error);
        setBookings([]);
      }

      // Fetch pending booking requests for rides owned by the user through API (uses service role)
      try {
        const pendingResponse = await fetch("/api/bookings?view=owner&status=pending");
        if (pendingResponse.ok) {
          const pendingData = (await pendingResponse.json()) as PendingBookingEntry[];
          console.log("Pending bookings (owner view):", pendingData);
          setPendingBookings(pendingData);
        } else {
          console.error("Error fetching owner bookings: HTTP", pendingResponse.status);
          setPendingBookings([]);
        }
      } catch (error: unknown) {
        console.error("Error fetching owner pending bookings:", error);
        setPendingBookings([]);
      }

      setLoading(false);
    };

    fetchProfileData();
  }, [router, session, sessionUserEmail, sessionUserId, sessionUserName, status]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }
    if (status !== "authenticated") {
      setConversations([]);
      setIsLoadingConversations(false);
      return;
    }
    void fetchConversations();
  }, [fetchConversations, status]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }
    const interval = window.setInterval(() => {
      void fetchConversations(false);
    }, 15000);
    return () => {
      window.clearInterval(interval);
    };
  }, [fetchConversations, status]);

  useEffect(() => {
    if (!activeChat?.conversationId) {
      return;
    }
    const interval = window.setInterval(() => {
      void fetchChatMessages(activeChat.conversationId, false);
    }, 5000);
    return () => {
      window.clearInterval(interval);
    };
  }, [activeChat?.conversationId, fetchChatMessages]);

  useEffect(() => {
    if (!activeChat) {
      return;
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCloseChat();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [activeChat, handleCloseChat]);

  useEffect(() => {
    scrollChatToBottom();
  }, [chatMessages, scrollChatToBottom]);

  const handleDeleteRide = async (rideId: string) => {
    if (!rideId) {
      return;
    }
    try {
      const response = await fetch(`/api/rides?id=${rideId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setRides((prev) => prev.filter((ride) => ride.id !== rideId));
        setNotificationType("success");
        setNotificationMessage(t.rideDeleted);
        setTimeout(() => setNotificationMessage(null), 3000);
      } else {
        const error = await response.json();
        setNotificationType("error");
        setNotificationMessage(error.error || t.rideDeleted);
        setTimeout(() => setNotificationMessage(null), 3000);
      }
    } catch (err) {
      console.error("Virhe:", err);
      setNotificationType("error");
      setNotificationMessage(t.rideDeleted);
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  const handleBookingResponse = async (bookingId: string, action: "accept" | "reject") => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      });

      if (response.ok) {
        setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
        setNotificationType("success");
        setNotificationMessage(
          action === "accept"
            ? t.bookingAccepted
            : t.bookingRejected
        );
        setTimeout(() => setNotificationMessage(null), 3000);
      } else {
        const error = await response.json();
        setNotificationType("error");
        setNotificationMessage(error.error || "Error processing booking");
        setTimeout(() => setNotificationMessage(null), 3000);
      }
    } catch (err) {
      console.error("Error:", err);
      setNotificationType("error");
      setNotificationMessage("Error processing booking");
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotificationType("error");
      setNotificationMessage("Kuvatiedosto on liian suuri. Enimmäiskoko on 5 MB.");
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setNotificationType("error");
      setNotificationMessage("Valitse kuvatiedosto (JPG, PNG, etc.).");
      setTimeout(() => setNotificationMessage(null), 3000);
      return;
    }

    setIsUploadingPicture(true);

    // Create a data URL for the image (store locally)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setProfilePicture(dataUrl);
      // Store in localStorage
      if (user?.id) {
        localStorage.setItem(`profilePicture_${user.id}`, dataUrl);
      }
      try {
        const response = await fetch("/api/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePictureData: dataUrl }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error?.error || "Profile update failed");
        }

        setNotificationType("success");
        setNotificationMessage(t.profileUpdated);
      } catch (error: unknown) {
        console.error("Error saving profile picture:", error);
        setNotificationType("error");
        setNotificationMessage(t.profilePictureError);
      } finally {
        setIsUploadingPicture(false);
        setTimeout(() => setNotificationMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditBio = () => {
    setBioDraft(bio);
    setIsEditingBio(true);
  };

  const handleCancelBioEdit = () => {
    setIsEditingBio(false);
    setBioDraft(bio);
  };

  const handleSaveBio = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: bioDraft }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || "Profile update failed");
      }

      setBio(bioDraft);
      setNotificationType("success");
      setNotificationMessage(t.bioSaved);
    } catch (error: unknown) {
      console.error("Error updating bio:", error);
      setNotificationType("error");
      setNotificationMessage(t.profileUpdateError);
    } finally {
      setIsEditingBio(false);
      setTimeout(() => setNotificationMessage(null), 3000);
    }
  };

  const openRiderProfileModal = (profile: RiderProfileSummary | null | undefined, fallbackEmail: string) => {
    const fallbackProfile: RiderProfileSummary = {
      name: fallbackEmail,
      email: fallbackEmail,
      bio: "",
      profilePictureData: null,
      driverRating: null,
      driverRatingCount: 0,
    };
    setSelectedRiderProfile(profile ?? fallbackProfile);
    setShowRiderProfileModal(true);
  };

  const closeRiderProfileModal = () => {
    setShowRiderProfileModal(false);
    setSelectedRiderProfile(null);
  };

  if (loading) {
    return <p className="text-center text-emerald-600">{t.loading}</p>;
  }

  if (!user) {
    return <p className="text-center text-neutral-600">{t.signInRequired}</p>;
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100 py-16 px-4"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md border border-emerald-100 p-6">
        <h1 className="text-3xl font-bold text-emerald-700 mb-6">{t.title}</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.userInfo}</h2>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={getProfileAltText(user.name, user.email, t.profilePicture)}
                    width={128}
                    height={128}
                    unoptimized
                    className="w-32 h-32 rounded-full object-cover border-4 border-emerald-200 shadow-md"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 text-4xl font-bold shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowProfilePictureModal(true)}
                className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-medium text-sm"
              >
                {isUploadingPicture ? t.uploading : t.addProfilePicture}
              </button>
            </div>

            {/* Profile Picture Modal */}
            {showProfilePictureModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6"
                >
                  <h3 className="text-lg font-semibold text-emerald-700 mb-4">{t.addProfilePicture}</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    {t.profilePicture} personalisointiin käytetään.</p>
                  
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        handleProfilePictureChange(e);
                        setShowProfilePictureModal(false);
                      }}
                      disabled={isUploadingPicture}
                      className="hidden"
                    />
                    <span className="block w-full px-4 py-2 bg-emerald-500 text-white text-center rounded-lg hover:bg-emerald-600 transition font-medium text-sm disabled:opacity-50 cursor-pointer">
                      {isUploadingPicture ? t.uploading : t.selectImage}
                    </span>
                  </label>

                  <button
                    onClick={() => setShowProfilePictureModal(false)}
                    className="w-full mt-3 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium text-sm"
                  >
                    {t.cancel}
                  </button>
                </motion.div>
              </div>
            )}

            {/* Bio Modal */}
            {isEditingBio && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-6"
                >
                  <h3 className="text-lg font-semibold text-emerald-700 mb-4">{t.editBio}</h3>
                  <textarea
                    value={bioDraft}
                    onChange={(event) => setBioDraft(event.target.value)}
                    className="w-full h-32 border border-neutral-200 rounded-xl p-3 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder={t.bio}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button
                      onClick={handleSaveBio}
                      className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition text-sm"
                    >
                      {t.save}
                    </button>
                    <button
                      onClick={handleCancelBioEdit}
                      className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition text-sm"
                    >
                      {t.cancel}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* User Info */}
            <div className="flex-1">
              <p className="mb-3"><strong className="text-emerald-700">{t.name}:</strong> {user.name}</p>
              <p><strong className="text-emerald-700">{t.email}:</strong> {user.email}</p>
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">{t.bio}</h3>
                {bio ? (
                  <p className="mt-2 text-neutral-600 whitespace-pre-line">{bio}</p>
                ) : (
                  <p className="mt-2 text-neutral-500 italic">{t.noBio}</p>
                )}
                <button
                  onClick={handleEditBio}
                  className="mt-3 inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                >
                  {bio ? t.editBio : t.addBio}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.myRides}</h2>
          {rides.length === 0 ? (
            <p className="text-neutral-600">{t.noRides}</p>
          ) : (
            <div className="space-y-4">
              {rides.map((ride) => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border border-emerald-100 rounded-xl shadow-sm flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-emerald-700">{ride.from} → {ride.to}</p>
                    <p className="text-sm text-neutral-600">
                      {ride.date} klo {ride.time} – {ride.price} €
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRide(ride.id)}
                    className="text-sm font-medium text-red-600 hover:bg-red-100 rounded-lg hover:text-red-700 transition"
                  >
                    {t.delete}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.pendingBookings}</h2>
          {pendingBookings.length === 0 ? (
            <p className="text-neutral-600">{t.noPendingBookings}</p>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => {
                const formattedDeparture = formatRideDateTime(booking.ride?.departure);
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-4 border border-yellow-200 bg-yellow-50 rounded-xl shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-emerald-700">
                          {booking.ride?.from_city} → {booking.ride?.to_city}
                        </p>
                        <p className="text-sm text-neutral-600">{formattedDeparture}</p>
                        <p className="text-sm text-neutral-600">
                          {t.riderLabel}: {booking.rider?.name ?? booking.user_email}
                        </p>
                        {booking.rider?.driverRating ? (
                          <p className="text-xs text-neutral-500 mt-1">
                            {t.driverRating}: {booking.rider.driverRating} ⭐ ({booking.rider.driverRatingCount ?? 0})
                          </p>
                        ) : null}
                        <p className="text-sm text-emerald-700 font-medium">
                          {booking.ride?.price_eur} €
                        </p>
                      </div>
                      <button
                        onClick={() => openRiderProfileModal(booking.rider, booking.user_email ?? "")}
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition"
                      >
                        {t.viewProfile}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBookingResponse(booking.id, "accept")}
                        className="flex-1 px-3 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition text-sm"
                      >
                        {t.accept}
                      </button>
                      <button
                        onClick={() => handleBookingResponse(booking.id, "reject")}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition text-sm"
                      >
                        {t.reject}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-emerald-700 mb-4">{t.messages}</h2>
          {isLoadingConversations ? (
            <p className="text-neutral-600">{t.chatLoading}</p>
          ) : conversations.length === 0 ? (
            <p className="text-neutral-600">{t.noMessages}</p>
          ) : (
            <div className="space-y-4">
              {conversations.map((conversation) => {
                const partnerName = conversation.partner?.name || conversation.partner?.email || t.unknownUser;
                const partnerInitial = partnerName.trim().charAt(0) || "?";
                const lastMessage = conversation.lastMessage;
                const lastMessagePreview = lastMessage
                  ? `${lastMessage.senderId === currentUserId ? `${t.chatYou}: ` : ""}${lastMessage.content}`
                  : t.chatEmpty;
                const timestamp = formatMessageTimestamp(
                  lastMessage?.createdAt ?? conversation.updatedAt ?? conversation.createdAt ?? null
                );
                return (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      {conversation.partner?.profilePictureData ? (
                        <Image
                          src={conversation.partner.profilePictureData}
                          alt={getProfileAltText(
                            conversation.partner?.name,
                            conversation.partner?.email,
                            partnerName
                          )}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 rounded-full border border-emerald-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                          {partnerInitial.toUpperCase()}
                        </div>
                      )}
                      <div>
                        {timestamp ? (
                          <p className="text-xs uppercase tracking-wide text-neutral-400">{timestamp}</p>
                        ) : null}
                        <h3 className="text-base font-semibold text-emerald-700">{partnerName}</h3>
                        {conversation.ride?.from_city && conversation.ride?.to_city ? (
                          <p className="text-sm text-neutral-600">
                            {conversation.ride.from_city} → {conversation.ride.to_city}
                          </p>
                        ) : null}
                        <p className="mt-1 max-w-md truncate text-sm text-neutral-600">{lastMessagePreview}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenChatFromList(conversation)}
                      className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                    >
                      {t.chatOpen}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-emerald-700">{t.bookedRides}</h2>
            <Link
              href={`/${locale}/bookings`}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition"
            >
              {t.manageBookings}
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-neutral-600">{t.noBookedRides}</p>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border border-emerald-100 rounded-xl shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                        bookingStatusBadges[b.status]?.className ?? bookingStatusBadges.pending.className
                      }`}
                    >
                      {bookingStatusBadges[b.status]?.label ?? bookingStatusBadges.pending.label}
                    </span>
                    <p className="text-xs text-neutral-500">
                      {formatBookingDate(b.created_at)}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-700">
                    {b.ride?.from_city} → {b.ride?.to_city}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {formatRideDateTime(b.ride?.departure)}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t.driver}: {b.ride?.driver_name || "Unknown"}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-emerald-700 font-medium">
                      {b.ride?.price_eur} €
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showRiderProfileModal && selectedRiderProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h2 className="text-lg font-semibold text-emerald-700 mb-4 text-center">{t.riderProfileTitle}</h2>
            <div className="flex flex-col items-center text-center">
              {selectedRiderProfile.profilePictureData ? (
                <Image
                  src={selectedRiderProfile.profilePictureData}
                  alt={getProfileAltText(
                    selectedRiderProfile.name,
                    selectedRiderProfile.email,
                    t.riderProfileTitle
                  )}
                  width={112}
                  height={112}
                  unoptimized
                  className="w-28 h-28 rounded-full object-cover border-4 border-emerald-200 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 text-4xl font-bold shadow-md">
                  {(selectedRiderProfile.name || selectedRiderProfile.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
              <h3 className="mt-4 text-xl font-semibold text-emerald-700">
                {selectedRiderProfile.name ?? selectedRiderProfile.email}
              </h3>
              <p className="text-sm text-neutral-500">{selectedRiderProfile.email}</p>
              <div className="mt-3">
                <p className="text-sm font-medium text-neutral-700">
                  {t.driverRating}:{" "}
                  {selectedRiderProfile.driverRating
                    ? `${selectedRiderProfile.driverRating} ⭐ (${selectedRiderProfile.driverRatingCount ?? 0})`
                    : t.ratingUnavailable}
                </p>
              </div>
              {selectedRiderProfile.bio ? (
                <p className="mt-4 text-sm text-neutral-600 whitespace-pre-line">
                  {selectedRiderProfile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm text-neutral-500 italic">{t.noBio}</p>
              )}
            </div>
            <button
              onClick={closeRiderProfileModal}
              className="mt-6 w-full px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition text-sm"
            >
              {t.close}
            </button>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {activeChat && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={handleCloseChat}
          >
            <motion.div
              key={activeChat.conversationId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-3 border-b border-neutral-100 px-6 py-4">
                {activeChat.partnerPicture ? (
                  <Image
                    src={activeChat.partnerPicture}
                    alt={getProfileAltText(activeChat.partnerName, activeChat.partnerEmail, activeChat.partnerName)}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-full border border-emerald-100 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                    {activeChat.partnerName.trim().charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-emerald-700">{activeChat.partnerName}</h3>
                  {activeChat.partnerEmail ? (
                    <p className="text-sm text-neutral-500">{activeChat.partnerEmail}</p>
                  ) : null}
                  {activeConversationDetails?.ride?.from_city && activeConversationDetails?.ride?.to_city ? (
                    <p className="text-sm text-neutral-500">
                      {activeConversationDetails.ride.from_city} → {activeConversationDetails.ride.to_city}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={handleCloseChat}
                  className="ml-2 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
                  aria-label={t.close}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex max-h-96 flex-col gap-3 overflow-y-auto px-6 py-4">
                {isChatLoading ? (
                  <p className="text-sm text-neutral-500">{t.chatLoading}</p>
                ) : chatMessages.length === 0 ? (
                  <p className="text-sm text-neutral-500">{t.chatEmpty}</p>
                ) : (
                  chatMessages.map((message) => {
                    const isOwnMessage = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                            isOwnMessage
                              ? "bg-emerald-500 text-white"
                              : "bg-neutral-100 text-neutral-800"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          <p
                            className={`mt-1 text-[11px] ${
                              isOwnMessage ? "text-emerald-50/80" : "text-neutral-500"
                            }`}
                          >
                            {formatMessageTimestamp(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendChatMessage();
                }}
                className="flex items-end gap-3 border-t border-neutral-100 px-6 py-4"
              >
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={t.chatPlaceholder}
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-60"
                  disabled={isSendingChat}
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSendingChat || !chatInput.trim()}
                >
                  {t.chatSend}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {notificationMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-4 right-4 rounded-xl px-6 py-3 shadow-lg text-white ${
            notificationType === "success" ? "bg-emerald-500" : "bg-red-500"
          }`}
        >
          {notificationMessage}
        </motion.div>
      )}
    </motion.main>
  );
}
