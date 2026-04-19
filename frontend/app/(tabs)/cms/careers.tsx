import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ArrowLeft,
    Save,
    Plus,
    Trash2,
    Briefcase,
    MapPin,
    Clock,
    X,
    Layout,
    Globe,
    Zap,
    Heart,
    Edit2,
    Eye,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { CareersPageConfig, JobOpening, initialCareersPage, initialJobOpenings } from '@/constants/cmsDefaults';
import { useCMS } from '@/context/CMSContext';

export default function CareersCMS() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { careersPage, jobOpenings, setCareersPage, setJobOpenings, isLoaded, batchUpdateAndSync } = useCMS();
    
    const [config, setConfig] = useState<CareersPageConfig>(initialCareersPage);
    const [jobs, setJobs] = useState<JobOpening[]>(initialJobOpenings);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [editingJob, setEditingJob] = useState<JobOpening | null>(null);

    useEffect(() => {
        if (isLoaded) {
            if (careersPage) setConfig(careersPage);
            if (jobOpenings && jobOpenings.length > 0) setJobs(jobOpenings);
            setLoading(false);
        }
    }, [isLoaded, careersPage, jobOpenings]);

    const handleSave = async () => {
        try {
            await batchUpdateAndSync({
                careersPage: config,
                jobOpenings: jobs
            }, true);
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setHasUnsavedChanges(false);
            Alert.alert('✅ Success', 'Careers page and job openings published!');
        } catch (e) {
            console.error('[CareersCMS] Save Error:', e);
            Alert.alert('❌ Error', 'Failed to save careers data.');
        }
    };

    const updateConfig = (updates: Partial<CareersPageConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
        setHasUnsavedChanges(true);
    };

    const addJob = () => {
        const newJob: JobOpening = {
            id: Date.now().toString(),
            title: 'New Role',
            department: 'Engineering',
            location: 'Remote',
            employmentType: 'FULL_TIME',
            summary: 'Short summary...',
            description: 'Full description...',
            responsibilities: '',
            requirements: '',
            status: 'OPEN',
            isPublished: false,
            displayOrder: jobs.length
        };
        setEditingJob(newJob);
    };

    const saveEditingJob = () => {
        if (!editingJob) return;
        
        const exists = jobs.find(j => j.id === editingJob.id);
        if (exists) {
            setJobs(prev => prev.map(j => j.id === editingJob.id ? editingJob : j));
        } else {
            setJobs(prev => [...prev, editingJob]);
        }
        
        setEditingJob(null);
        setHasUnsavedChanges(true);
    };

    const removeJob = (id: string) => {
        Alert.alert('Delete Job', 'Are you sure you want to remove this job opening?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: () => {
                    setJobs(prev => prev.filter(j => j.id !== id));
                    setHasUnsavedChanges(true);
                }
            }
        ]);
    };

    const updatePerk = (id: string, updates: any) => {
        updateConfig({
            perks: config.perks.map(p => p.id === id ? { ...p, ...updates } : p)
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.adminPrimary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <ArrowLeft size={20} color="#FFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Careers Editor</Text>
                        <Text style={styles.headerSubtitle}>Manage recruitment & culture</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            style={styles.previewBtn}
                            onPress={() => router.push('/(public)/careers')}
                        >
                            <Eye size={18} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveBtn, !hasUnsavedChanges && { opacity: 0.6 }]}
                            onPress={handleSave}
                            disabled={!hasUnsavedChanges}
                        >
                            <Save size={18} color="#FFF" />
                            <Text style={styles.saveBtnText}>Publish</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
                {/* HERO SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Careers Hero</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.heroTitle}
                                onChangeText={t => updateConfig({ heroTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Hero Subtitle</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.heroSubtitle}
                                onChangeText={t => updateConfig({ heroSubtitle: t })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* INTRO SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Intro & Culture</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Intro Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.introTitle}
                                onChangeText={t => updateConfig({ introTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Intro Content</Text>
                            <TextInput
                                style={[styles.input, { height: 120 }]}
                                value={config.introContent}
                                onChangeText={t => updateConfig({ introContent: t })}
                                multiline
                            />
                        </View>
                    </View>
                </View>

                {/* PERKS SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Benefits & Perks</Text>
                    <View style={styles.card}>
                        {config.perks.map((perk) => (
                            <View key={perk.id} style={styles.perkEditor}>
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, { flex: 1 }]}>
                                        <Text style={styles.inputLabel}>Title</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={perk.title}
                                            onChangeText={t => updatePerk(perk.id, { title: t })}
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, { width: 80 }]}>
                                        <Text style={styles.inputLabel}>Icon</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={perk.icon}
                                            onChangeText={t => updatePerk(perk.id, { icon: t })}
                                        />
                                    </View>
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Description</Text>
                                    <TextInput
                                        style={[styles.input, { height: 60 }]}
                                        value={perk.desc}
                                        onChangeText={t => updatePerk(perk.id, { desc: t })}
                                        multiline
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* JOB OPENINGS */}
                <View style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>Job Openings ({jobs.length})</Text>
                        <TouchableOpacity style={styles.addBtn} onPress={addJob}>
                            <Plus size={16} color="#FFF" />
                            <Text style={styles.addBtnText}>Add Role</Text>
                        </TouchableOpacity>
                    </View>

                    {jobs.map((job) => (
                        <View key={job.id} style={styles.card}>
                            <View style={styles.jobCardTop}>
                                <View>
                                    <Text style={styles.jobTitle}>{job.title}</Text>
                                    <View style={styles.jobMeta}>
                                        <Text style={styles.jobMetaText}>{job.department} • {job.location}</Text>
                                    </View>
                                </View>
                                <View style={[styles.statusBadge, job.isPublished ? styles.statusPublished : styles.statusHidden]}>
                                    <Text style={job.isPublished ? styles.statusPublishedText : styles.statusHiddenText}>
                                        {job.isPublished ? 'Published' : 'Draft'}
                                    </Text>
                                </View>
                            </View>
                            
                            <View style={styles.jobActions}>
                                <TouchableOpacity style={styles.jobActionBtn} onPress={() => setEditingJob(job)}>
                                    <Edit2 size={16} color={Colors.primary} />
                                    <Text style={styles.jobActionBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.jobActionBtn} onPress={() => removeJob(job.id)}>
                                    <Trash2 size={16} color={Colors.danger} />
                                    <Text style={[styles.jobActionBtnText, { color: Colors.danger }]}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>

                {/* CTA SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Talent Network CTA</Text>
                    <View style={styles.card}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Title</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaTitle}
                                onChangeText={t => updateConfig({ ctaTitle: t })}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>CTA Subtitle</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={config.ctaSubtitle}
                                onChangeText={t => updateConfig({ ctaSubtitle: t })}
                                multiline
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Button Text</Text>
                            <TextInput
                                style={styles.input}
                                value={config.ctaButtonText}
                                onChangeText={t => updateConfig({ ctaButtonText: t })}
                            />
                        </View>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* JOB EDITOR MODAL */}
            {editingJob && (
                <Modal visible={!!editingJob} animationType="slide" presentationStyle="pageSheet">
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setEditingJob(null)} style={styles.modalClose}>
                                <X size={24} color={Colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.modalTitle}>{editingJob.id ? 'Edit Role' : 'New Role'}</Text>
                            <TouchableOpacity onPress={saveEditingJob} style={styles.modalSave}>
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={{ padding: 20 }}>
                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Job Title</Text>
                                    <TextInput 
                                        style={styles.input} 
                                        value={editingJob.title} 
                                        onChangeText={t => setEditingJob({...editingJob, title: t})} 
                                    />
                                </View>
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, {flex: 1}]}>
                                        <Text style={styles.inputLabel}>Department</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={editingJob.department} 
                                            onChangeText={t => setEditingJob({...editingJob, department: t})} 
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, {flex: 1}]}>
                                        <Text style={styles.inputLabel}>Location</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={editingJob.location} 
                                            onChangeText={t => setEditingJob({...editingJob, location: t})} 
                                        />
                                    </View>
                                </View>
                                
                                <View style={styles.row}>
                                    <View style={[styles.inputGroup, {flex: 1}]}>
                                        <Text style={styles.inputLabel}>Employment Type</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={editingJob.employmentType} 
                                            onChangeText={t => setEditingJob({...editingJob, employmentType: t})} 
                                            placeholder="FULL_TIME, PART_TIME, etc"
                                        />
                                    </View>
                                    <View style={[styles.inputGroup, {flex: 1}]}>
                                        <Text style={styles.inputLabel}>Salary/Comp Info</Text>
                                        <TextInput 
                                            style={styles.input} 
                                            value={editingJob.salaryInfo} 
                                            onChangeText={t => setEditingJob({...editingJob, salaryInfo: t})} 
                                        />
                                    </View>
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Short Summary (Card View)</Text>
                                    <TextInput 
                                        style={[styles.input, {height: 80}]} 
                                        multiline 
                                        value={editingJob.summary} 
                                        onChangeText={t => setEditingJob({...editingJob, summary: t})} 
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Full Description</Text>
                                    <TextInput 
                                        style={[styles.input, {height: 150}]} 
                                        multiline 
                                        value={editingJob.description} 
                                        onChangeText={t => setEditingJob({...editingJob, description: t})} 
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Responsibilities (Markdown or Newlines)</Text>
                                    <TextInput 
                                        style={[styles.input, {height: 120}]} 
                                        multiline 
                                        value={editingJob.responsibilities} 
                                        onChangeText={t => setEditingJob({...editingJob, responsibilities: t})} 
                                    />
                                </View>

                                <View style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>Requirements (Markdown or Newlines)</Text>
                                    <TextInput 
                                        style={[styles.input, {height: 120}]} 
                                        multiline 
                                        value={editingJob.requirements} 
                                        onChangeText={t => setEditingJob({...editingJob, requirements: t})} 
                                    />
                                </View>

                                <View style={styles.toggleField}>
                                    <Text style={styles.inputLabel}>Publish Status</Text>
                                    <TouchableOpacity 
                                        style={[styles.statusToggle, editingJob.isPublished && styles.statusToggleActive]}
                                        onPress={() => setEditingJob({...editingJob, isPublished: !editingJob.isPublished})}
                                    >
                                        <Text style={[styles.statusToggleText, editingJob.isPublished && styles.statusToggleTextActive]}>
                                            {editingJob.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </ScrollView>
                    </View>
                </Modal>
            )}

            {hasUnsavedChanges && (
                <View style={styles.unsavedBar}>
                    <Text style={styles.unsavedText}>You have unsaved changes</Text>
                    <TouchableOpacity style={styles.unsavedSaveBtn} onPress={handleSave}>
                        <Text style={styles.unsavedSaveText}>Publish All</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        backgroundColor: Colors.navy,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
    },
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    previewBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '700',
    },
    body: {
        flex: 1,
    },
    bodyContent: {
        padding: 16,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        color: Colors.text,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    perkEditor: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    addBtnText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
    },
    jobCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    jobTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    jobMeta: {
        marginTop: 4,
    },
    jobMetaText: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusPublished: {
        backgroundColor: Colors.success + '15',
    },
    statusHidden: {
        backgroundColor: Colors.textSecondary + '15',
    },
    statusPublishedText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.success,
    },
    statusHiddenText: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    jobActions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: 12,
        gap: 16,
    },
    jobActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    jobActionBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalClose: {
        padding: 4,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
    },
    modalSave: {
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    modalSaveText: {
        color: '#FFF',
        fontWeight: '700',
    },
    modalBody: {
        flex: 1,
    },
    statusToggle: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusToggleActive: {
        backgroundColor: Colors.success + '10',
        borderColor: Colors.success + '20',
    },
    statusToggleText: {
        fontWeight: '800',
        color: Colors.textSecondary,
    },
    statusToggleTextActive: {
        color: Colors.success,
    },
    toggleField: {
        marginTop: 8,
        marginBottom: 24,
    },
    unsavedBar: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        backgroundColor: Colors.navy,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    unsavedText: {
        color: '#FFF',
        fontWeight: '600',
    },
    unsavedSaveBtn: {
        backgroundColor: Colors.adminPrimary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    unsavedSaveText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
