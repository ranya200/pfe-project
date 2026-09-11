import { useState, useRef, useEffect } from "react";
import {
  Fab, Paper, Box, Typography, TextField, IconButton, CircularProgress,
  List, ListItemButton, ListItemText, Divider, Tooltip,
} from "@mui/material";
import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import AddCommentIcon from "@mui/icons-material/AddComment";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AxiosInstance from "../components/AxiosInstance";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("chat"); // "chat" | "history"
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const loadConversations = async () => {
    try {
      const res = await AxiosInstance.get("chatbot/conversations/");
      setConversations(res.data);
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    }
  };

  const openHistory = () => {
    setView("history");
    loadConversations();
  };

  const openConversation = async (id) => {
    try {
      const res = await AxiosInstance.get(`chatbot/conversations/${id}/`);
      setConversationId(id);
      setMessages(res.data.messages.map((m) => ({ role: m.role, content: m.content })));
      setView("chat");
    } catch (err) {
      console.error("Erreur chargement conversation:", err);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setView("chat");
  };

  const deleteConversation = async (id, e) => {
    e.stopPropagation();
    try {
      await AxiosInstance.delete(`chatbot/conversations/${id}/delete/`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === conversationId) startNewConversation();
    } catch (err) {
      console.error("Erreur suppression conversation:", err);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await AxiosInstance.post(
        "chatbot/message/",
        { message: text, conversation_id: conversationId },
        { timeout: 30000 }
      );
      setMessages([...newMessages, { role: "assistant", content: res.data.reply }]);
      if (!conversationId) setConversationId(res.data.conversation_id);
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessaie plus tard." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 1300 }}>
      {open && (
        <Paper
          elevation={6}
          sx={{
            width: 340, height: 460, mb: 2, display: "flex", flexDirection: "column",
            borderRadius: 3, overflow: "hidden",
          }}
        >
          {/* Header */}
          <Box sx={{ bgcolor: "primary.main", color: "white", p: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {view === "history" && (
                <IconButton size="small" onClick={() => setView("chat")} sx={{ color: "white" }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <Typography variant="subtitle1">
                {view === "history" ? "Historique" : "Assistant"}
              </Typography>
            </Box>
            <Box>
              {view === "chat" && (
                <>
                  <Tooltip title="Nouvelle conversation">
                    <IconButton size="small" onClick={startNewConversation} sx={{ color: "white" }}>
                      <AddCommentIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Historique">
                    <IconButton size="small" onClick={openHistory} sx={{ color: "white" }}>
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </>
              )}
              <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: "white" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Vue Historique */}
          {view === "history" ? (
            <List sx={{ flex: 1, overflowY: "auto", py: 0 }}>
              {conversations.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 3 }}>
                  Aucune conversation pour l'instant.
                </Typography>
              )}
              {conversations.map((c) => (
                <Box key={c.id}>
                  <ListItemButton onClick={() => openConversation(c.id)} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <ListItemText
                      primary={c.title}
                      secondary={new Date(c.updated_at).toLocaleString("fr-FR")}
                      primaryTypographyProps={{ noWrap: true }}
                    />
                    <IconButton size="small" onClick={(e) => deleteConversation(c.id, e)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                  <Divider />
                </Box>
              ))}
            </List>
          ) : (
            <>
              {/* Vue Chat */}
              <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, bgcolor: "grey.50" }}>
                {messages.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", mt: 2 }}>
                    Pose-moi une question sur l'application 👋
                  </Typography>
                )}
                {messages.map((m, i) => (
                  <Box key={i} sx={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", mb: 1 }}>
                    <Box sx={{
                      maxWidth: "75%", px: 1.5, py: 1, borderRadius: 2,
                      bgcolor: m.role === "user" ? "primary.main" : "white",
                      color: m.role === "user" ? "white" : "text.primary",
                      boxShadow: 1,
                    }}>
                      <Typography variant="body2">{m.content}</Typography>
                    </Box>
                  </Box>
                ))}
                {loading && <CircularProgress size={20} sx={{ ml: 1 }} />}
                <div ref={endRef} />
              </Box>

              <Box sx={{ p: 1, display: "flex", gap: 1, borderTop: "1px solid #eee" }}>
                <TextField
                  fullWidth size="small" placeholder="Écris un message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <IconButton color="primary" onClick={sendMessage} disabled={loading}>
                  <SendIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Paper>
      )}

      <Fab color="primary" onClick={() => setOpen(!open)}>
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>
    </Box>
  );
}