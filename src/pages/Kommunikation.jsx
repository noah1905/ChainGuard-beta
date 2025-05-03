import '@/styles/animations.css';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/supabaseClient.js';
import Sidebar from '@/components/Sidebar.jsx';
import {
    MessageSquare,
    Users,
    PlusCircle,
    Search,
    Send,
    ChevronDown,
    Calendar,
    File,
    CheckCircle,
    Clock,
    Bell,
    X,
    AlertCircle,
    FileText,
    Download,
    Paperclip,
    Filter,
    Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Kommunikation() {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activeTab, setActiveTab] = useState('lieferanten');
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [selectedTeamChat, setSelectedTeamChat] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('chainguard_kommunikation_onboarding') !== 'dismissed';
    });
    const [teamChats, setTeamChats] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showAddTask, setShowAddTask] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        assignedTo: '',
        dueDate: '',
        priority: 'medium',
        status: 'pending'
    });
    const [showAddDocument, setShowAddDocument] = useState(false);
    const [newDocument, setNewDocument] = useState({
        title: '',
        fileType: 'PDF',
        status: 'Entwurf',
        version: '1.0',
        file: null
    });
    const [taskStatusFilter, setTaskStatusFilter] = useState('Alle');
    const [taskAssigneeFilter, setTaskAssigneeFilter] = useState('Alle');
    const [documentStatusFilter, setDocumentStatusFilter] = useState('Alle');
    const messageEndRef = useRef(null);
    const popupRef = useRef(null);

    // Fetch user and profile
    useEffect(() => {
        const getUser = async () => {
            const { data, error } = await supabase.auth.getUser();
            if (data?.user) {
                setUser(data.user);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();
                setIsAdmin(profile?.role === 'admin');
            }
        };
        getUser();
    }, []);

    // Fetch data from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            // Fetch suppliers for conversations
            const { data: suppliersData, error: suppliersError } = await supabase
                .from('suppliers')
                .select('id, name');
            if (suppliersError) {
                console.error('Error fetching suppliers:', suppliersError);
                setSuccessMessage('Fehler beim Laden der Lieferantendaten');
            }

            // Fetch messages and group into conversations
            const { data: messagesData, error: messagesError } = await supabase
                .from('messages')
                .select('*, supplier:supplier_id(name)')
                .order('timestamp', { ascending: true });
            if (messagesError) {
                console.error('Error fetching messages:', messagesError);
            }
            if (messagesData && suppliersData) {
                const groupedConversations = suppliersData.map(supplier => {
                    const supplierMessages = messagesData
                        .filter(msg => msg.supplier_id === supplier.id)
                        .map(msg => ({
                            id: msg.id,
                            sender: msg.user_id === user.id ? 'me' : 'them',
                            content: msg.content,
                            timestamp: format(parseISO(msg.timestamp), 'dd.MM.yyyy HH:mm'),
                            senderName: msg.sender_name,
                            isRead: msg.is_read
                        }));
                    const lastMessage = supplierMessages[supplierMessages.length - 1];
                    return {
                        id: supplier.id,
                        supplier: supplier.name,
                        lastMessage: lastMessage?.content || '',
                        timestamp: lastMessage?.timestamp || '',
                        date: lastMessage ? format(parseISO(lastMessage.timestamp), 'dd. MMMM yyyy') : '',
                        unread: supplierMessages.filter(msg => !msg.isRead && msg.sender === 'them').length,
                        avatar: supplier.name.slice(0, 2).toUpperCase(),
                        status: 'offline', // Could integrate real-time status
                        messages: supplierMessages
                    };
                }).filter(conv => conv.messages.length > 0);
                setConversations(groupedConversations);
            } else {
                // Fallback dummy data
                setConversations([
                    {
                        id: 1,
                        supplier: 'TechComp AG',
                        lastMessage: 'Wir benötigen noch Ihre aktualisierten Zertifikate bis Ende des Monats.',
                        timestamp: '10:23',
                        date: '03. Mai 2025',
                        unread: 2,
                        avatar: 'TC',
                        status: 'online',
                        messages: [
                            { id: 1, sender: 'them', content: 'Guten Tag, wir haben Ihre Anfrage erhalten und werden die Informationen zusammenstellen.', timestamp: '02.05.2025 14:30', senderName: 'Maria Schmidt, TechComp AG' },
                            { id: 2, sender: 'me', content: 'Vielen Dank! Bitte achten Sie darauf, dass alle Zertifikate nach ISO 14001 aktualisiert sind.', timestamp: '02.05.2025 15:45', senderName: 'Ich' },
                            { id: 3, sender: 'them', content: 'Wir werden sicherstellen, dass alle Unterlagen vollständig sind. Gibt es eine Frist, die wir einhalten müssen?', timestamp: '02.05.2025 16:20', senderName: 'Maria Schmidt, TechComp AG' },
                            { id: 4, sender: 'me', content: 'Wir benötigen noch Ihre aktualisierten Zertifikate bis Ende des Monats.', timestamp: '03.05.2025 10:23', senderName: 'Ich' }
                        ]
                    }
                ]);
            }

            // Fetch team chats (simulated as user-to-user messages for simplicity)
            const { data: teamMessagesData } = await supabase
                .from('messages')
                .select('*')
                .is('supplier_id', null);
            if (teamMessagesData) {
                const groupedTeamChats = [
                    {
                        id: 1,
                        name: 'Lieferketten-Team',
                        lastMessage: 'Meeting zur Quartalsplanung heute um 14:00 Uhr',
                        timestamp: '11:45',
                        date: '03. Mai 2025',
                        unread: 3,
                        members: ['AK', 'MR', 'JS', 'TK'],
                        messages: teamMessagesData.map(msg => ({
                            id: msg.id,
                            sender: msg.sender_name,
                            avatar: msg.sender_name.slice(0, 2).toUpperCase(),
                            content: msg.content,
                            timestamp: format(parseISO(msg.timestamp), 'dd.MM.yyyy HH:mm')
                        }))
                    }
                ];
                setTeamChats(groupedTeamChats);
            } else {
                setTeamChats([
                    {
                        id: 1,
                        name: 'Lieferketten-Team',
                        lastMessage: 'Meeting zur Quartalsplanung heute um 14:00 Uhr',
                        timestamp: '11:45',
                        date: '03. Mai 2025',
                        unread: 3,
                        members: ['AK', 'MR', 'JS', 'TK'],
                        messages: [
                            { id: 1, sender: 'Anna Krüger', avatar: 'AK', content: 'Guten Morgen! Wir sollten heute die Quartalsplanung besprechen.', timestamp: '03.05.2025 09:30' },
                            { id: 2, sender: 'Michael Richter', avatar: 'MR', content: 'Einverstanden. Ich habe die Berichte vorbereitet und werde sie im Meeting präsentieren.', timestamp: '03.05.2025 10:15' },
                            { id: 3, sender: 'Julia Schmidt', avatar: 'JS', content: 'Ich habe noch Feedback von zwei Lieferanten bekommen, das wir einbeziehen sollten.', timestamp: '03.05.2025 10:45' },
                            { id: 4, sender: 'Thomas König', avatar: 'TK', content: 'Meeting zur Quartalsplanung heute um 14:00 Uhr', timestamp: '03.05.2025 11:45' }
                        ]
                    }
                ]);
            }

            // Fetch tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*');
            if (tasksError) {
                console.error('Error fetching tasks:', tasksError);
            }
            if (tasksData) {
                setTasks(tasksData.map(task => ({
                    id: task.id,
                    title: task.title,
                    assignedTo: task.assigned_to_name,
                    dueDate: format(parseISO(task.due_date), 'dd. MMMM yyyy'),
                    priority: task.priority,
                    status: task.status
                })));
            } else {
                setTasks([
                    {
                        id: 1,
                        title: 'Lieferantenbewertung TechComp AG',
                        assignedTo: 'Ich',
                        dueDate: '10. Mai 2025',
                        priority: 'high',
                        status: 'pending'
                    }
                ]);
            }

            // Fetch documents
            const { data: documentsData, error: documentsError } = await supabase
                .from('documents')
                .select('*');
            if (documentsError) {
                console.error('Error fetching documents:', documentsError);
            }
            if (documentsData) {
                setDocuments(documentsData.map(doc => ({
                    id: doc.id,
                    title: doc.title,
                    type: doc.file_type,
                    modifiedBy: doc.modified_by_name,
                    modifiedDate: format(parseISO(doc.modified_date), 'dd. MMMM yyyy'),
                    status: doc.status,
                    version: doc.version,
                    fileUrl: doc.file_url
                })));
            } else {
                setDocuments([
                    {
                        id: 1,
                        title: 'Lieferkettengesetz - Leitfaden 2025',
                        type: 'PDF',
                        modifiedBy: 'Lisa Bauer',
                        modifiedDate: '01. Mai 2025',
                        status: 'Freigegeben',
                        version: '2.1'
                    }
                ]);
            }

            // Fetch notifications
            const { data: notificationsData, error: notificationsError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id);
            if (notificationsError) {
                console.error('Error fetching notifications:', notificationsError);
            }
            if (notificationsData) {
                setNotifications(notificationsData.map(notif => ({
                    id: notif.id,
                    title: notif.title,
                    description: notif.description,
                    date: format(parseISO(notif.created_at), 'dd. MMMM yyyy'),
                    isRead: notif.is_read,
                    priority: notif.priority || 'medium'
                })));
            } else {
                setNotifications([
                    {
                        id: 1,
                        title: 'Neue Nachricht von TechComp AG',
                        description: 'Maria Schmidt hat auf Ihre Anfrage geantwortet.',
                        date: '03. Mai 2025',
                        isRead: false,
                        priority: 'medium'
                    }
                ]);
            }

            // Log page view
            await supabase.from('audit_logs').insert([
                {
                    user_id: user.id,
                    action: 'viewed_kommunikation_page',
                    details: 'Accessed communication and collaboration page',
                    created_at: new Date()
                }
            ]);
        };

        fetchData();
    }, [user]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (selectedConversation || selectedTeamChat) {
            scrollToBottom();
        }
    }, [selectedConversation, selectedTeamChat]);

    // Handle success message timeout
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    // Handle onboarding dismissal
    useEffect(() => {
        if (!showOnboarding) {
            localStorage.setItem('chainguard_kommunikation_onboarding', 'dismissed');
        }
    }, [showOnboarding]);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        let conversationId = selectedConversation?.id || selectedTeamChat?.id || crypto.randomUUID();
        let supplierId = activeTab === 'lieferanten' ? selectedConversation?.id : null;

        // Insert message into Supabase
        const { data, error } = await supabase
            .from('messages')
            .insert([
                {
                    conversation_id: conversationId,
                    supplier_id: supplierId,
                    user_id: user.id,
                    content: newMessage,
                    sender_name: 'Ich',
                    timestamp: new Date(),
                    is_read: false
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            setSuccessMessage('Fehler beim Senden der Nachricht');
            return;
        }

        if (activeTab === 'lieferanten' && selectedConversation) {
            const updatedConversations = conversations.map(conv => {
                if (conv.id === selectedConversation.id) {
                    const updatedMessages = [
                        ...conv.messages,
                        {
                            id: data.id,
                            sender: 'me',
                            content: newMessage,
                            timestamp: format(new Date(), 'dd.MM.yyyy HH:mm'),
                            senderName: 'Ich',
                            isRead: true
                        }
                    ];
                    return {
                        ...conv,
                        messages: updatedMessages,
                        lastMessage: newMessage,
                        timestamp: format(new Date(), 'HH:mm'),
                        date: format(new Date(), 'dd. MMMM yyyy'),
                        unread: 0
                    };
                }
                return conv;
            });
            setConversations(updatedConversations);
            setSelectedConversation({
                ...selectedConversation,
                messages: [
                    ...selectedConversation.messages,
                    {
                        id: data.id,
                        sender: 'me',
                        content: newMessage,
                        timestamp: format(new Date(), 'dd.MM.yyyy HH:mm'),
                        senderName: 'Ich',
                        isRead: true
                    }
                ],
                lastMessage: newMessage,
                timestamp: format(new Date(), 'HH:mm'),
                date: format(new Date(), 'dd. MMMM yyyy')
            });
        } else if (activeTab === 'teams' && selectedTeamChat) {
            const updatedTeamChats = teamChats.map(chat => {
                if (chat.id === selectedTeamChat.id) {
                    const updatedMessages = [
                        ...chat.messages,
                        {
                            id: data.id,
                            sender: 'Ich',
                            avatar: 'ME',
                            content: newMessage,
                            timestamp: format(new Date(), 'dd.MM.yyyy HH:mm')
                        }
                    ];
                    return {
                        ...chat,
                        messages: updatedMessages,
                        lastMessage: newMessage,
                        timestamp: format(new Date(), 'HH:mm'),
                        date: format(new Date(), 'dd. MMMM yyyy'),
                        unread: 0
                    };
                }
                return chat;
            });
            setTeamChats(updatedTeamChats);
            setSelectedTeamChat({
                ...selectedTeamChat,
                messages: [
                    ...selectedTeamChat.messages,
                    {
                        id: data.id,
                        sender: 'Ich',
                        avatar: 'ME',
                        content: newMessage,
                        timestamp: format(new Date(), 'dd.MM.yyyy HH:mm')
                    }
                ],
                lastMessage: newMessage,
                timestamp: format(new Date(), 'HH:mm'),
                date: format(new Date(), 'dd. MMMM yyyy')
            });
        }

        setNewMessage('');
        setSuccessMessage('Nachricht gesendet');
        setTimeout(scrollToBottom, 100);

        // Log message action
        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'sent_message',
                details: `Sent message to ${activeTab === 'lieferanten' ? selectedConversation.supplier : selectedTeamChat.name}`,
                created_at: new Date()
            }
        ]);
    };

    const selectConversation = async (conversation) => {
        const updatedConversations = conversations.map(conv => {
            if (conv.id === conversation.id) {
                return { ...conv, unread: 0 };
            }
            return conv;
        });
        setConversations(updatedConversations);
        setSelectedConversation({ ...conversation, unread: 0 });
        setSelectedTeamChat(null);

        // Mark messages as read in Supabase
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversation.id)
            .eq('is_read', false);
    };

    const selectTeamChat = async (chat) => {
        const updatedTeamChats = teamChats.map(c => {
            if (c.id === chat.id) {
                return { ...c, unread: 0 };
            }
            return c;
        });
        setTeamChats(updatedTeamChats);
        setSelectedTeamChat({ ...chat, unread: 0 });
        setSelectedConversation(null);

        // Mark team messages as read
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', chat.id)
            .eq('is_read', false);
    };

    const handleTaskSubmit = async () => {
        if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) {
            setSuccessMessage('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        const { data, error } = await supabase
            .from('tasks')
            .insert([
                {
                    title: newTask.title,
                    assigned_to: user.id, // Replace with actual assignee ID in production
                    assigned_to_name: newTask.assignedTo,
                    due_date: newTask.dueDate,
                    priority: newTask.priority,
                    status: newTask.status,
                    created_by: user.id
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating task:', error);
            setSuccessMessage('Fehler beim Erstellen der Aufgabe');
            return;
        }

        setTasks([
            ...tasks,
            {
                id: data.id,
                title: newTask.title,
                assignedTo: newTask.assignedTo,
                dueDate: format(parseISO(newTask.dueDate), 'dd. MMMM yyyy'),
                priority: newTask.priority,
                status: newTask.status
            }
        ]);
        setNewTask({
            title: '',
            assignedTo: '',
            dueDate: '',
            priority: 'medium',
            status: 'pending'
        });
        setShowAddTask(false);
        setSuccessMessage('Aufgabe erfolgreich erstellt');

        // Log task creation
        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'created_task',
                details: `Created task: ${newTask.title}`,
                created_at: new Date()
            }
        ]);
    };

    const handleDocumentSubmit = async () => {
        if (!newDocument.title || !newDocument.file) {
            setSuccessMessage('Bitte alle Pflichtfelder ausfüllen');
            return;
        }

        // Simulate file upload to Supabase Storage
        const fileName = `${Date.now()}_${newDocument.file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, newDocument.file);

        if (uploadError) {
            console.error('Error uploading document:', uploadError);
            setSuccessMessage('Fehler beim Hochladen des Dokuments');
            return;
        }

        const { data, error } = await supabase
            .from('documents')
            .insert([
                {
                    title: newDocument.title,
                    file_type: newDocument.fileType,
                    modified_by: user.id,
                    modified_by_name: 'Ich',
                    modified_date: new Date(),
                    status: newDocument.status,
                    version: newDocument.version,
                    file_url: `${supabase.storage.from('documents').getPublicUrl(fileName).data.publicUrl}`
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating document:', error);
            setSuccessMessage('Fehler beim Erstellen des Dokuments');
            return;
        }

        setDocuments([
            ...documents,
            {
                id: data.id,
                title: newDocument.title,
                type: newDocument.fileType,
                modifiedBy: 'Ich',
                modifiedDate: format(new Date(), 'dd. MMMM yyyy'),
                status: newDocument.status,
                version: newDocument.version,
                fileUrl: data.file_url
            }
        ]);
        setNewDocument({ title: '', fileType: 'PDF', status: 'Entwurf', version: '1.0', file: null });
        setShowAddDocument(false);
        setSuccessMessage('Dokument erfolgreich hochgeladen');

        // Log document upload
        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'uploaded_document',
                details: `Uploaded document: ${newDocument.title}`,
                created_at: new Date()
            }
        ]);
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (error) {
            console.error('Error updating task:', error);
            setSuccessMessage('Fehler beim Aktualisieren der Aufgabe');
            return;
        }

        setTasks(tasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
        setSuccessMessage('Aufgabenstatus aktualisiert');

        // Log task status update
        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'updated_task_status',
                details: `Updated task ${taskId} to status: ${newStatus}`,
                created_at: new Date()
            }
        ]);
    };

    const updateDocumentStatus = async (docId, newStatus) => {
        const { error } = await supabase
            .from('documents')
            .update({ status: newStatus, modified_date: new Date(), modified_by: user.id, modified_by_name: 'Ich' })
            .eq('id', docId);

        if (error) {
            console.error('Error updating document:', error);
            setSuccessMessage('Fehler beim Aktualisieren des Dokuments');
            return;
        }

        setDocuments(documents.map(doc =>
            doc.id === docId
                ? { ...doc, status: newStatus, modifiedDate: format(new Date(), 'dd. MMMM yyyy'), modifiedBy: 'Ich' }
                : doc
        ));
        setSuccessMessage('Dokumentstatus aktualisiert');

        // Log document status update
        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action: 'updated_document_status',
                details: `Updated document ${docId} to status: ${newStatus}`,
                created_at: new Date()
            }
        ]);
    };

    const markNotificationAsRead = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
            return;
        }

        setNotifications(notifications.map(notification =>
            notification.id === id ? { ...notification, isRead: true } : notification
        ));
    };

    const dismissNotification = async (id) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error dismissing notification:', error);
            return;
        }

        setNotifications(notifications.filter(notification => notification.id !== id));
    };

    const getPriorityStyles = (priority) => {
        switch (priority) {
            case 'high': return 'border-red-200 bg-red-50';
            case 'medium': return 'border-yellow-200 bg-yellow-50';
            case 'low': return 'border-blue-200 bg-blue-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    const getPriorityIndicator = (priority) => {
        switch (priority) {
            case 'high': return <span className="block w-2 h-2 rounded-full bg-red-500"></span>;
            case 'medium': return <span className="block w-2 h-2 rounded-full bg-yellow-500"></span>;
            case 'low': return <span className="block w-2 h-2 rounded-full bg-blue-500"></span>;
            default: return null;
        }
    };

    const getTaskPriorityStyles = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-700 bg-red-50 border-red-100';
            case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-100';
            case 'low': return 'text-green-700 bg-green-50 border-green-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const getTaskStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'text-green-700 bg-green-50 border-green-100';
            case 'in-progress': return 'text-blue-700 bg-blue-50 border-blue-100';
            case 'pending': return 'text-gray-700 bg-gray-50 border-gray-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const getDocumentStatusStyles = (status) => {
        switch (status) {
            case 'Freigegeben': return 'text-green-700 bg-green-50 border-green-100';
            case 'In Prüfung': return 'text-blue-700 bg-blue-50 border-blue-100';
            case 'Entwurf': return 'text-gray-700 bg-gray-50 border-gray-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const filteredConversations = conversations.filter(conv =>
        conv.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTeamChats = teamChats.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredTasks = tasks.filter(task =>
        (taskStatusFilter === 'Alle' ||
            (taskStatusFilter === 'Zu erledigen' && task.status === 'pending') ||
            (taskStatusFilter === 'In Bearbeitung' && task.status === 'in-progress') ||
            (taskStatusFilter === 'Abgeschlossen' && task.status === 'completed')) &&
        (taskAssigneeFilter === 'Alle' ||
            (taskAssigneeFilter === 'Mir zugewiesen' && task.assignedTo === 'Ich'))
    );

    const filteredDocuments = documents.filter(doc =>
        documentStatusFilter === 'Alle' || doc.status === documentStatusFilter
    );

    const unreadCount = notifications.filter(notification => !notification.isRead).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 ml-72">
                <div className="max-w-7xl mx-auto p-8">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Kommunikation & Kollaboration</h1>
                            <p className="text-gray-500 mt-1">Effiziente Zusammenarbeit mit Lieferanten und Team</p>
                        </div>
                        <div className="flex items-center gap-4">
                            {isAdmin && (
                                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-full">
                                    Admin-Modus
                                </span>
                            )}
                            <div className="relative">
                                <Bell size={20} className="text-gray-600 hover:text-blue-600 cursor-pointer" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </header>

                    {/* Onboarding Message */}
                    {showOnboarding && (
                        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold">Willkommen bei den Kommunikations- und Kollaborationstools</h3>
                                        <p className="text-sm mt-1">
                                            Hier können Sie einfach mit Ihren Lieferanten kommunizieren, Teamaufgaben verwalten und Dokumente zur Freigabe teilen.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowOnboarding(false)}
                                    className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                                >
                                    <X size={16} className="text-blue-500" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-3 gap-8">
                        {/* Left 2/3 Column */}
                        <div className="col-span-2">
                            {/* Tabs */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                                <div className="flex border-b border-gray-200">
                                    <button
                                        className={`flex-1 py-4 text-center font-medium relative ${activeTab === 'lieferanten' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                        onClick={() => setActiveTab('lieferanten')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <MessageSquare size={18} />
                                            <span>Lieferantenkommunikation</span>
                                        </div>
                                        {activeTab === 'lieferanten' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                                    </button>
                                    <button
                                        className={`flex-1 py-4 text-center font-medium relative ${activeTab === 'teams' ? 'text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                                        onClick={() => setActiveTab('teams')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <Users size={18} />
                                            <span>Teamkollaboration</span>
                                        </div>
                                        {activeTab === 'teams' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
                                    </button>
                                </div>

                                {/* Messaging Area */}
                                <div className="flex h-[600px]">
                                    {/* Conversation List */}
                                    <div className="w-1/3 border-r border-gray-200">
                                        <div className="p-4 border-b border-gray-200">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder={activeTab === 'lieferanten' ? 'Lieferant suchen...' : 'Team suchen...'}
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>
                                        <div className="overflow-y-auto h-[535px]">
                                            {activeTab === 'lieferanten' ? (
                                                filteredConversations.length > 0 ? (
                                                    filteredConversations.map(conv => (
                                                        <div
                                                            key={conv.id}
                                                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''}`}
                                                            onClick={() => selectConversation(conv)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${conv.status === 'online' ? 'bg-green-500' : conv.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'}`}>
                                                                    {conv.avatar}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-center">
                                                                        <h3 className="font-medium text-gray-900 truncate">{conv.supplier}</h3>
                                                                        <span className="text-xs text-gray-500">{conv.timestamp}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                                                                    <div className="flex justify-between items-center mt-1">
                                                                        <span className="text-xs text-gray-500">{conv.date}</span>
                                                                        {conv.unread > 0 && (
                                                                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                                                {conv.unread}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-500 py-8">Keine Gespräche gefunden</p>
                                                )
                                            ) : (
                                                filteredTeamChats.length > 0 ? (
                                                    filteredTeamChats.map(chat => (
                                                        <div
                                                            key={chat.id}
                                                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTeamChat?.id === chat.id ? 'bg-blue-50' : ''}`}
                                                            onClick={() => selectTeamChat(chat)}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white font-medium">
                                                                    {chat.name.slice(0, 2).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-center">
                                                                        <h3 className="font-medium text-gray-900 truncate">{chat.name}</h3>
                                                                        <span className="text-xs text-gray-500">{chat.timestamp}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                                                                    <div className="flex justify-between items-center mt-1">
                                                                        <span className="text-xs text-gray-500">{chat.date}</span>
                                                                        {chat.unread > 0 && (
                                                                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                                                {chat.unread}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-center text-gray-500 py-8">Keine Team-Chats gefunden</p>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Chat Area */}
                                    <div className="flex-1 flex flex-col">
                                        {(selectedConversation || selectedTeamChat) ? (
                                            <>
                                                <div className="p-4 border-b border-gray-200 bg-gray-50">
                                                    <h2 className="text-lg font-semibold text-gray-800">
                                                        {selectedConversation ? selectedConversation.supplier : selectedTeamChat.name}
                                                    </h2>
                                                    {selectedTeamChat && (
                                                        <p className="text-sm text-gray-500">Mitglieder: {selectedTeamChat.members.join(', ')}</p>
                                                    )}
                                                </div>
                                                <div className="flex-1 p-4 overflow-y-auto">
                                                    {(selectedConversation ? selectedConversation.messages : selectedTeamChat.messages).map(message => (
                                                        <div
                                                            key={message.id}
                                                            className={`mb-4 flex ${message.sender === 'me' || message.sender === 'Ich' ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className={`max-w-[70%] p-3 rounded-lg ${message.sender === 'me' || message.sender === 'Ich' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                                                            >
                                                                <p className="text-sm font-medium">{message.senderName || message.sender}</p>
                                                                <p className="text-sm mt-1">{message.content}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{message.timestamp}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div ref={messageEndRef} />
                                                </div>
                                                <div className="p-4 border-t border-gray-200 bg-white">
                                                    <div className="flex gap-2">
                                                        <textarea
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            placeholder="Nachricht schreiben..."
                                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                            rows={2}
                                                        />
                                                        <button
                                                            onClick={handleSendMessage}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-1 flex items-center justify-center text-gray-500">
                                                Wählen Sie ein Gespräch oder einen Team-Chat aus
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks Section */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <Calendar size={18} className="text-blue-600" />
                                        Aufgaben
                                    </h2>
                                    <button
                                        onClick={() => setShowAddTask(true)}
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <PlusCircle size={16} />
                                        Neue Aufgabe
                                    </button>
                                </div>
                                <div className="p-6">
                                    <div className="flex gap-4 mb-4">
                                        <div className="relative">
                                            <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={taskStatusFilter}
                                                onChange={(e) => setTaskStatusFilter(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option>Alle</option>
                                                <option>Zu erledigen</option>
                                                <option>In Bearbeitung</option>
                                                <option>Abgeschlossen</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <Tag size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={taskAssigneeFilter}
                                                onChange={(e) => setTaskAssigneeFilter(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option>Alle</option>
                                                <option>Mir zugewiesen</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {filteredTasks.length > 0 ? (
                                            filteredTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{task.title}</h3>
                                                            <p className="text-sm text-gray-600">Zugewiesen an: {task.assignedTo}</p>
                                                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                <Clock size={14} />
                                                                Fällig: {task.dueDate}
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskPriorityStyles(task.priority)}`}
                                                            >
                                                                {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                                                            </span>
                                                            <select
                                                                value={task.status}
                                                                onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                                                className={`text-xs px-2 py-1 rounded-full font-medium ${getTaskStatusStyles(task.status)}`}
                                                            >
                                                                <option value="pending">Zu erledigen</option>
                                                                <option value="in-progress">In Bearbeitung</option>
                                                                <option value="completed">Abgeschlossen</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">Keine Aufgaben gefunden</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right 1/3 Column */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <Bell size={18} className="text-blue-600" />
                                            Benachrichtigungen
                                            {unreadCount > 0 && (
                                                <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 font-medium rounded-full">
                                                    {unreadCount} neu
                                                </span>
                                            )}
                                        </h2>
                                    </div>
                                </div>
                                <div className="p-4 max-h-[300px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="space-y-3">
                                            {notifications.map(notification => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-3 border rounded-lg ${notification.isRead ? 'border-gray-200' : getPriorityStyles(notification.priority)} relative transition-all hover:shadow-sm ${notification.isRead ? 'opacity-75' : 'opacity-100'}`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            {!notification.isRead && getPriorityIndicator(notification.priority)}
                                                            <h3 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                                                                {notification.title}
                                                            </h3>
                                                        </div>
                                                        <button
                                                            onClick={() => dismissNotification(notification.id)}
                                                            className="text-gray-400 hover:text-gray-600"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                                                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                                        <span>{notification.date}</span>
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={() => markNotificationAsRead(notification.id)}
                                                                className="text-blue-600 hover:text-blue-800 font-medium"
                                                            >
                                                                Als gelesen markieren
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Keine Benachrichtigungen vorhanden</p>
                                        </div>
                                    )}
                                </div>

                                {/* Documents Section */}
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                            <FileText size={18} className="text-yellow-600" />
                                            Dokumente
                                        </h3>
                                        <button
                                            onClick={() => setShowAddDocument(true)}
                                            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            <PlusCircle size={16} />
                                            Neues Dokument
                                        </button>
                                    </div>
                                    <div className="relative mb-4">
                                        <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <select
                                            value={documentStatusFilter}
                                            onChange={(e) => setDocumentStatusFilter(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                                        >
                                            <option>Alle</option>
                                            <option>Entwurf</option>
                                            <option>In Prüfung</option>
                                            <option>Freigegeben</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {filteredDocuments.length > 0 ? (
                                            filteredDocuments.map(doc => (
                                                <div
                                                    key={doc.id}
                                                    className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h3 className="font-medium text-gray-900">{doc.title}</h3>
                                                            <p className="text-sm text-gray-600">Geändert von: {doc.modifiedBy}</p>
                                                            <p className="text-sm text-gray-600">Version: {doc.version}</p>
                                                            <p className="text-sm text-gray-600">{doc.modifiedDate}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span
                                                                className={`text-xs px-2 py-1 rounded-full font-medium ${getDocumentStatusStyles(doc.status)}`}
                                                            >
                                                                {doc.status}
                                                            </span>
                                                            {doc.fileUrl && (
                                                                <a
                                                                    href={doc.fileUrl}
                                                                    download
                                                                    className="text-blue-600 hover:text-blue-800"
                                                                >
                                                                    <Download size={16} />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isAdmin && (
                                                        <select
                                                            value={doc.status}
                                                            onChange={(e) => updateDocumentStatus(doc.id, e.target.value)}
                                                            className={`text-xs px-2 py-1 rounded-full font-medium mt-2 ${getDocumentStatusStyles(doc.status)}`}
                                                        >
                                                            <option value="Entwurf">Entwurf</option>
                                                            <option value="In Prüfung">In Prüfung</option>
                                                            <option value="Freigegeben">Freigegeben</option>
                                                        </select>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-500 py-8">Keine Dokumente gefunden</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Add Task Modal */}
                    {showAddTask && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Neue Aufgabe erstellen</h3>
                                    <button
                                        onClick={() => setShowAddTask(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Titel</label>
                                        <input
                                            type="text"
                                            value={newTask.title}
                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Zugewiesen an</label>
                                        <input
                                            type="text"
                                            value={newTask.assignedTo}
                                            onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fälligkeitsdatum</label>
                                        <input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Priorität</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="high">Hoch</option>
                                            <option value="medium">Mittel</option>
                                            <option value="low">Niedrig</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={newTask.status}
                                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="pending">Zu erledigen</option>
                                            <option value="in-progress">In Bearbeitung</option>
                                            <option value="completed">Abgeschlossen</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        onClick={() => setShowAddTask(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={handleTaskSubmit}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Erstellen
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Document Modal */}
                    {showAddDocument && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800">Neues Dokument hochladen</h3>
                                    <button
                                        onClick={() => setShowAddDocument(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Titel</label>
                                        <input
                                            type="text"
                                            value={newDocument.title}
                                            onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Dateityp</label>
                                        <select
                                            value={newDocument.fileType}
                                            onChange={(e) => setNewDocument({ ...newDocument, fileType: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="PDF">PDF</option>
                                            <option value="DOCX">DOCX</option>
                                            <option value="XLSX">XLSX</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select
                                            value={newDocument.status}
                                            onChange={(e) => setNewDocument({ ...newDocument, status: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="Entwurf">Entwurf</option>
                                            <option value="In Prüfung">In Prüfung</option>
                                            <option value="Freigegeben">Freigegeben</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Version</label>
                                        <input
                                            type="text"
                                            value={newDocument.version}
                                            onChange={(e) => setNewDocument({ ...newDocument, version: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Datei</label>
                                        <input
                                            type="file"
                                            accept=".pdf,.docx,.xlsx"
                                            onChange={(e) => setNewDocument({ ...newDocument, file: e.target.files[0] })}
                                            className="w-full p-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        onClick={() => setShowAddDocument(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                    >
                                        Abbrechen
                                    </button>
                                    <button
                                        onClick={handleDocumentSubmit}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Hochladen
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Success Message Toast */}
                    {successMessage && (
                        <div
                            ref={popupRef}
                            className="fixed bottom-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 transform animate-slideInRight flex items-center"
                        >
                            <CheckCircle size={16} className="mr-2" />
                            {successMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}