import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, query, serverTimestamp } from 'firebase/firestore';
import { Users, CheckCircle, BrainCircuit, Shield, Rocket, Target, Repeat, Award, PlusCircle, Home, Trash2, FileDown, X } from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

// --- Script Loader Utility ---
const loadedScripts = new Set();
const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (loadedScripts.has(src)) {
            return resolve();
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            loadedScripts.add(src);
            resolve();
        };
        script.onerror = () => reject(new Error(`Script load error for ${src}`));
        document.body.appendChild(script);
    });
};


// --- Main App Component ---
export default function App() {
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const [view, setView] = useState('dashboard'); // 'dashboard' or 'workspace'
    const [reports, setReports] = useState([]);
    const [activeReport, setActiveReport] = useState(null);
    const [activeReportId, setActiveReportId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-8d-app';

    // --- Firebase Initialization and Authentication ---
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const authInstance = getAuth(app);
            const dbInstance = getFirestore(app);
            setAuth(authInstance);
            setDb(dbInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    await signInAnonymously(authInstance);
                }
                setIsAuthReady(true);
            });
            return () => unsubscribe();
        } catch (error) {
            console.error("Error initializing Firebase:", error);
            setIsAuthReady(true);
        }
    }, []);

    // --- Data Fetching: All Reports for Dashboard ---
    useEffect(() => {
        if (!isAuthReady || !db) return;

        setIsLoading(true);
        const reportsCollectionPath = `artifacts/${appId}/public/data/8d-reports`;
        const q = query(collection(db, reportsCollectionPath));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const reportsData = [];
            querySnapshot.forEach((doc) => {
                reportsData.push({ id: doc.id, ...doc.data() });
            });
            setReports(reportsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady, db, appId]);


    // --- Data Fetching: Active Report for Workspace ---
    useEffect(() => {
        if (view !== 'workspace' || !db || !activeReportId) {
            setActiveReport(null);
            return;
        }
        
        const reportDocPath = `artifacts/${appId}/public/data/8d-reports/${activeReportId}`;
        const unsubscribe = onSnapshot(doc(db, reportDocPath), (docSnapshot) => {
            if (docSnapshot.exists()) {
                setActiveReport({ id: docSnapshot.id, ...docSnapshot.data() });
            } else {
                console.error("Report not found");
                setView('dashboard');
            }
        }, (error) => {
            console.error("Error fetching active report:", error);
        });

        return () => unsubscribe();
    }, [view, db, activeReportId, appId]);

    const handleCreateNewReport = async () => {
        if (!db || !userId) return;
        
        const newReportTitle = `Nuevo Informe 8D - ${new Date().toLocaleDateString()}`;
        const reportsCollectionPath = `artifacts/${appId}/public/data/8d-reports`;

        try {
            const docRef = await addDoc(collection(db, reportsCollectionPath), {
                title: newReportTitle,
                createdBy: userId,
                createdAt: serverTimestamp(),
                currentDiscipline: 'D1',
                d1_team: [{ name: `Usuario ${userId.substring(0, 6)}`, role: 'Líder' }],
                d2_problem: { what: '', where: '', when: '', who: '', why: '', how: '', how_many: '' },
                d3_containment: [{ action: '', responsible: '', date: '', verified: false }],
                d4_root_cause: { 
                    five_whys: [''], 
                    fishbone: { Manpower: [], Machine: [], Method: [], Material: [], Measurement: [], Environment: [] } 
                },
                d5_corrective_actions: [{ action: '', responsible: '', date: '', verified: false }],
                d6_implementation: { summary: '', validation_results: '' },
                d7_prevention: { updated_docs: '', new_standards: '' },
                d8_recognition: { summary: '', celebration_date: '' }
            });
            setActiveReportId(docRef.id);
            setView('workspace');
        } catch (error) {
            console.error("Error creating new report: ", error);
        }
    };
    
    const handleSelectReport = (id) => {
        setActiveReportId(id);
        setView('workspace');
    };
    
    const handleDeleteReport = async (id) => {
        if(!db) return;
        const reportDocPath = `artifacts/${appId}/public/data/8d-reports/${id}`;
        try {
            await deleteDoc(doc(db, reportDocPath));
        } catch(error) {
            console.error("Error deleting report:", error);
        }
    };

    const handleGoToDashboard = () => {
        setView('dashboard');
        setActiveReportId(null);
        setActiveReport(null);
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
                <div className="text-center">
                    <BrainCircuit className="mx-auto h-12 w-12 animate-pulse text-indigo-400" />
                    <h2 className="mt-4 text-2xl font-bold">Cargando Plataforma 8D...</h2>
                    <p className="mt-2 text-gray-400">Estableciendo conexión segura.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-indigo-400" />
                    <h1 className="text-xl font-bold tracking-wider">Plataforma 8D Interactiva</h1>
                </div>
                {userId && <p className="text-xs text-gray-400 font-mono">Usuario ID: {userId}</p>}
            </header>
            
            <main className="p-4 sm:p-6 lg:p-8">
                {view === 'dashboard' ? (
                    <Dashboard 
                        reports={reports} 
                        onSelectReport={handleSelectReport} 
                        onCreateNew={handleCreateNewReport}
                        onDeleteReport={handleDeleteReport}
                        isLoading={isLoading}
                    />
                ) : (
                    <Workspace 
                        report={activeReport}
                        reportId={activeReportId}
                        db={db}
                        onGoToDashboard={handleGoToDashboard}
                        appId={appId}
                    />
                )}
            </main>
        </div>
    );
}

// --- Reusable Modal Component ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <div className="mt-2 text-sm text-gray-300">
                    {children}
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 transition">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-500 transition">
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Dashboard Component ---
const Dashboard = ({ reports, onSelectReport, onCreateNew, onDeleteReport, isLoading }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    const openDeleteModal = (e, reportId) => {
        e.stopPropagation(); // Prevent card click event
        setReportToDelete(reportId);
        setModalOpen(true);
    };

    const confirmDelete = () => {
        if(reportToDelete) {
            onDeleteReport(reportToDelete);
        }
        setModalOpen(false);
        setReportToDelete(null);
    };

    return (
        <div>
            <ConfirmationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Eliminación"
            >
                <p>¿Estás seguro de que quieres eliminar este informe? Esta acción no se puede deshacer.</p>
            </ConfirmationModal>

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-white">Panel de Informes 8D</h2>
                <button onClick={onCreateNew} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-all">
                    <PlusCircle size={20} />
                    Nuevo Informe 8D
                </button>
            </div>
            {isLoading ? (
                <p className="text-center text-gray-400">Cargando informes...</p>
            ) : reports.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-700 rounded-lg">
                    <h3 className="text-xl font-semibold text-gray-300">No hay informes 8D todavía.</h3>
                    <p className="text-gray-500 mt-2">¡Crea tu primer informe para empezar a resolver problemas!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports.map(report => (
                        <div key={report.id} onClick={() => onSelectReport(report.id)} className="group bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700/80 transition-all duration-300 border border-gray-700 shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 relative">
                            <button onClick={(e) => openDeleteModal(e, report.id)} className="absolute top-3 right-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                            <h3 className="font-bold text-lg text-indigo-300 truncate pr-8">{report.title}</h3>
                            <p className="text-sm text-gray-400 mt-2">Disciplina Actual: <span className="font-semibold text-gray-200">{report.currentDiscipline || 'N/A'}</span></p>
                            <p className="text-xs text-gray-500 mt-3">Creado por: <span className="font-mono">{report.createdBy?.substring(0, 12)}...</span></p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- PDF Generation Logic ---
const generatePdf = (report) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("Informe 8D", 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text(report.title, 105, 30, { align: 'center' });

    let y = 45;

    const addSection = (title) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(title, 14, y);
        y += 7;
        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);
    };
    
    // D1: Team
    addSection("D1: Formar el Equipo");
    doc.autoTable({
        startY: y,
        head: [['Nombre', 'Rol']],
        body: report.d1_team.map(m => [m.name, m.role]),
        theme: 'grid'
    });
    y = doc.autoTable.previous.finalY + 10;

    // D2: Problem
    addSection("D2: Describir el Problema (5W2H)");
    const d2_body = Object.entries(report.d2_problem).map(([key, value]) => [key, value]);
    doc.autoTable({ startY: y, head: [['Pregunta', 'Descripción']], body: d2_body, theme: 'grid' });
    y = doc.autoTable.previous.finalY + 10;

    // D3: Containment
    addSection("D3: Acciones de Contención");
    doc.autoTable({ startY: y, head: [['Acción', 'Responsable', 'Fecha']], body: report.d3_containment.map(a => [a.action, a.responsible, a.date]), theme: 'grid' });
    y = doc.autoTable.previous.finalY + 10;

    // D4: Root Cause
    addSection("D4: Análisis de Causa Raíz");
    doc.setFont(undefined, 'bold');
    doc.text("5 Porqués:", 14, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    report.d4_root_cause.five_whys.forEach((why, i) => {
        const splitWhy = doc.splitTextToSize(`${i+1}. ${why}`, 180);
        doc.text(splitWhy, 16, y);
        y += (splitWhy.length * 5) + 2;
    });

    if (y > 250) { doc.addPage(); y = 20; }
    y += 5;
    doc.setFont(undefined, 'bold');
    doc.text("Diagrama de Ishikawa:", 14, y);
    y += 7;
    doc.setFont(undefined, 'normal');
    const fishbone_body = Object.entries(report.d4_root_cause.fishbone).map(([category, causes]) => [category, causes.join('\n')]);
    doc.autoTable({ startY: y, head: [['Categoría', 'Causas Potenciales']], body: fishbone_body, theme: 'grid' });
    y = doc.autoTable.previous.finalY + 10;
    
    // D5-D8 would be added here following the same pattern
    
    doc.save(`Informe_8D_${report.id}.pdf`);
};

// --- Workspace Component ---
const Workspace = ({ report, reportId, db, onGoToDashboard, appId }) => {
    const [activeDiscipline, setActiveDiscipline] = useState('D1');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

    useEffect(() => {
        if(report?.currentDiscipline) {
            setActiveDiscipline(report.currentDiscipline)
        }
    }, [report]);
    
    const handleUpdate = useCallback(async (field, value) => {
        if (!db || !reportId) return;
        const reportDocPath = `artifacts/${appId}/public/data/8d-reports/${reportId}`;
        try {
            await updateDoc(doc(db, reportDocPath), { [field]: value });
        } catch (error) {
            console.error("Error updating document: ", error);
        }
    }, [db, reportId, appId]);

    const handleDeepUpdate = useCallback(async (path, value) => {
         if (!db || !reportId) return;
        const reportDocPath = `artifacts/${appId}/public/data/8d-reports/${reportId}`;
        try {
            await updateDoc(doc(db, reportDocPath), { [path]: value });
        } catch (error) {
            console.error("Error performing deep update:", error)
        }
    }, [db, reportId, appId]);

    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        try {
            await Promise.all([
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
                loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js')
            ]);
            generatePdf(report);
        } catch (error) {
            console.error("Failed to load PDF generation scripts:", error);
            // We avoid window.alert in this environment. A more robust solution would be a custom modal.
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    if (!report) {
        return (
            <div className="flex items-center justify-center h-64">
                <p>Cargando informe...</p>
            </div>
        );
    }
    
    const disciplineComponents = {
        'D1': <D1_Team data={report.d1_team} onUpdate={(val) => handleDeepUpdate('d1_team', val)} />,
        'D2': <D2_ProblemDescription data={report.d2_problem} onUpdate={handleDeepUpdate} />,
        'D3': <D3_ContainmentActions data={report.d3_containment} onUpdate={(val) => handleDeepUpdate('d3_containment', val)} />,
        'D4': <D4_RootCauseAnalysis data={report.d4_root_cause} onUpdate={handleDeepUpdate} />,
        'D5': <D5_CorrectiveActions data={report.d5_corrective_actions} onUpdate={(val) => handleDeepUpdate('d5_corrective_actions', val)} />,
        'D6': <D6_Implementation data={report.d6_implementation} onUpdate={(val) => handleDeepUpdate('d6_implementation', val)} />,
        'D7': <D7_Prevention data={report.d7_prevention} onUpdate={(val) => handleDeepUpdate('d7_prevention', val)} />,
        'D8': <D8_Recognition data={report.d8_recognition} onUpdate={(val) => handleDeepUpdate('d8_recognition', val)} />,
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-4">
                    <button onClick={onGoToDashboard} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all">
                        <Home size={16} /> Panel
                    </button>
                    <h2 className="text-2xl font-bold text-white truncate">{report.title}</h2>
                </div>
                <button 
                    onClick={handleGeneratePdf}
                    disabled={isGeneratingPdf}
                    className="flex items-center justify-center gap-2 px-4 py-2 w-40 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 transition-all disabled:bg-green-800 disabled:cursor-not-allowed"
                >
                    {isGeneratingPdf ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Generando...</span>
                        </>
                    ) : (
                        <>
                            <FileDown size={18} />
                            <span>Exportar a PDF</span>
                        </>
                    )}
                </button>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
                <DisciplineNav active={activeDiscipline} setActive={setActiveDiscipline} onUpdate={(val) => handleUpdate('currentDiscipline', val)} />
                <div className="flex-1 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
                   {disciplineComponents[activeDiscipline]}
                </div>
            </div>
        </div>
    );
};

// --- Navigation for Disciplines ---
const DisciplineNav = ({ active, setActive, onUpdate }) => {
    const disciplines = [
        { id: 'D1', name: 'Formar el Equipo', icon: Users },
        { id: 'D2', name: 'Describir el Problema', icon: CheckCircle },
        { id: 'D3', name: 'Acciones de Contención', icon: Shield },
        { id: 'D4', name: 'Análisis de Causa Raíz', icon: BrainCircuit },
        { id: 'D5', name: 'Acciones Correctivas', icon: Rocket },
        { id: 'D6', name: 'Implementar y Validar', icon: Target },
        { id: 'D7', name: 'Prevenir Recurrencia', icon: Repeat },
        { id: 'D8', name: 'Reconocer al Equipo', icon: Award },
    ];
    
    const handleSelect = (id) => {
        setActive(id);
        onUpdate(id);
    }

    return (
        <nav className="w-full lg:w-64 flex-shrink-0">
            <ul className="space-y-2">
                {disciplines.map(d => (
                    <li key={d.id}>
                        <button onClick={() => handleSelect(d.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${active === d.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-700/70 text-gray-300'}`}>
                            <d.icon size={20} />
                            <span className="font-semibold">{d.id}: {d.name}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
};


// --- Individual Discipline Components ---
const Section = ({ title, description, children }) => (
    <div className="mb-8">
        <h3 className="text-2xl font-bold text-indigo-300">{title}</h3>
        <p className="text-gray-400 mt-1 mb-6">{description}</p>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InputField = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
    </div>
);

const D1_Team = ({ data, onUpdate }) => {
    const handleMemberChange = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        onUpdate(newData);
    };
    
    const addMember = () => {
        onUpdate([...data, { name: '', role: '' }]);
    };
    
    const removeMember = (index) => {
        const newData = data.filter((_, i) => i !== index);
        onUpdate(newData);
    }
    
    return (
        <Section title="D1: Formar el Equipo" description="Identifica a los miembros del equipo multifuncional que resolverán el problema.">
            {data.map((member, index) => (
                <div key={index} className="flex gap-4 items-center bg-gray-800 p-3 rounded-lg">
                    <div className="flex-1"><InputField label="Nombre del Miembro" value={member.name} onChange={(e) => handleMemberChange(index, 'name', e.target.value)} placeholder="Ej: Juan Pérez"/></div>
                    <div className="flex-1"><InputField label="Rol en el Equipo" value={member.role} onChange={(e) => handleMemberChange(index, 'role', e.target.value)} placeholder="Ej: Ingeniero de Calidad"/></div>
                    <button onClick={() => removeMember(index)} className="text-gray-500 hover:text-red-400 mt-6"><Trash2 size={18}/></button>
                </div>
            ))}
            <button onClick={addMember} className="mt-4 text-indigo-400 hover:text-indigo-300 font-semibold">+ Añadir miembro</button>
        </Section>
    );
};

const D2_ProblemDescription = ({ data, onUpdate }) => {
    const fields = [
        { key: 'what', label: '¿Qué está mal?' },
        { key: 'where', label: '¿Dónde se observa?' },
        { key: 'when', label: '¿Cuándo ocurre?' },
        { key: 'who', label: '¿A quién afecta?' },
        { key: 'why', label: '¿Por qué es un problema?' },
        { key: 'how', label: '¿Cómo ocurre?' },
        { key: 'how_many', label: '¿Cuántas unidades/instancias están afectadas?' },
    ];
    return (
        <Section title="D2: Describir el Problema" description="Utiliza el método 5W2H para detallar el problema con precisión.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(field => (
                     <InputField 
                        key={field.key}
                        label={field.label}
                        value={data[field.key] || ''}
                        onChange={(e) => onUpdate(`d2_problem.${field.key}`, e.target.value)}
                    />
                ))}
            </div>
        </Section>
    );
};

const D3_ContainmentActions = ({data, onUpdate}) => {
     const handleActionChange = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        onUpdate(newData);
    };

    const addAction = () => {
        onUpdate([...data, { action: '', responsible: '', date: '', verified: false }]);
    };
    
    const removeAction = (index) => {
        onUpdate(data.filter((_, i) => i !== index));
    }

    return(
        <Section title="D3: Implementar Acciones de Contención" description="Define y verifica acciones temporales para proteger al cliente mientras se encuentra la causa raíz.">
            {data.map((item, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                           <InputField label="Acción de contención" value={item.action} onChange={(e) => handleActionChange(index, 'action', e.target.value)} placeholder="Ej: Inspeccionar 100% del lote X"/>
                        </div>
                        <button onClick={() => removeAction(index)} className="ml-4 text-gray-500 hover:text-red-400 "><Trash2 size={18}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Responsable" value={item.responsible} onChange={(e) => handleActionChange(index, 'responsible', e.target.value)} placeholder="Nombre"/>
                        <InputField label="Fecha Límite" type="date" value={item.date} onChange={(e) => handleActionChange(index, 'date', e.target.value)}/>
                    </div>
                </div>
            ))}
             <button onClick={addAction} className="mt-4 text-indigo-400 hover:text-indigo-300 font-semibold">+ Añadir acción</button>
        </Section>
    )
};

const D4_RootCauseAnalysis = ({ data, onUpdate }) => {
    // 5 Whys Logic
    const handleWhyChange = (index, value) => {
        const newWhys = [...data.five_whys];
        newWhys[index] = value;
        onUpdate('d4_root_cause.five_whys', newWhys);
    };
    const addWhy = () => {
        onUpdate('d4_root_cause.five_whys', [...data.five_whys, '']);
    };

    // Fishbone Logic
    const handleFishboneChange = (category, index, value) => {
        const newFishbone = { ...data.fishbone };
        newFishbone[category][index] = value;
        onUpdate('d4_root_cause.fishbone', newFishbone);
    };
    const addFishboneCause = (category) => {
        const newFishbone = { ...data.fishbone };
        newFishbone[category].push('');
        onUpdate('d4_root_cause.fishbone', newFishbone);
    };
     const removeFishboneCause = (category, index) => {
        const newFishbone = { ...data.fishbone };
        newFishbone[category] = newFishbone[category].filter((_, i) => i !== index);
        onUpdate('d4_root_cause.fishbone', newFishbone);
    };
    
    const fishboneCategories = {
        Manpower: "Mano de Obra", Machine: "Maquinaria", Method: "Método",
        Material: "Materiales", Measurement: "Medición", Environment: "Medio Ambiente"
    };

    return (
        <Section title="D4: Identificar la Causa Raíz" description="Usa técnicas como '5 Porqués' y el Diagrama de Ishikawa para encontrar el origen del problema.">
            <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold text-lg text-gray-200 mb-3">Análisis de los 5 Porqués</h4>
                <div className="space-y-3">
                    {data.five_whys.map((why, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="text-indigo-400 font-bold">Porqué #{index + 1}:</span>
                            <input type="text" value={why} onChange={(e) => handleWhyChange(index, e.target.value)} placeholder={index === 0 ? 'Describe el problema inicial...' : '¿Por qué ocurrió eso?'} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500 transition"/>
                        </div>
                    ))}
                </div>
                <button onClick={addWhy} className="mt-4 text-indigo-400 hover:text-indigo-300 font-semibold">+ Añadir porqué</button>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg mt-6">
                 <h4 className="font-semibold text-lg text-gray-200 mb-3">Diagrama de Ishikawa (Espina de Pescado)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(fishboneCategories).map(([key, name]) => (
                        <div key={key} className="bg-gray-900/70 p-3 rounded-md">
                            <h5 className="font-bold text-indigo-400">{name}</h5>
                            <div className="mt-2 space-y-2">
                                {data.fishbone[key]?.map((cause, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <input type="text" value={cause} onChange={e => handleFishboneChange(key, index, e.target.value)} placeholder="Causa potencial..." className="w-full bg-gray-700 border-gray-600 rounded px-2 py-1 text-sm"/>
                                        <button onClick={() => removeFishboneCause(key, index)} className="text-gray-500 hover:text-red-400"><X size={16}/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => addFishboneCause(key)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">+ Añadir causa</button>
                        </div>
                    ))}
                 </div>
            </div>
        </Section>
    );
};

// --- Other Discipline Components (similar structure to D3) ---
const D5_CorrectiveActions = ({ data, onUpdate }) => {
    const handleActionChange = (index, field, value) => {
        const newData = [...data];
        newData[index][field] = value;
        onUpdate(newData);
    };

    const addAction = () => {
        onUpdate([...data, { action: '', responsible: '', date: '', verified: false }]);
    };
    
    const removeAction = (index) => onUpdate(data.filter((_, i) => i !== index));

    return (
        <Section title="D5: Desarrollar Acciones Correctivas Permanentes" description="Define acciones que eliminarán la causa raíz del problema.">
            {data.map((item, index) => (
                <div key={index} className="bg-gray-800 p-4 rounded-lg space-y-3">
                     <div className="flex justify-between items-start">
                         <div className="flex-1">
                             <InputField label="Acción Correctiva Permanente (PCA)" value={item.action} onChange={(e) => handleActionChange(index, 'action', e.target.value)} placeholder="Ej: Modificar el herramental de producción"/>
                         </div>
                        <button onClick={() => removeAction(index)} className="ml-4 text-gray-500 hover:text-red-400 "><Trash2 size={18}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Responsable" value={item.responsible} onChange={(e) => handleActionChange(index, 'responsible', e.target.value)} placeholder="Nombre"/>
                        <InputField label="Fecha de Implementación" type="date" value={item.date} onChange={(e) => handleActionChange(index, 'date', e.target.value)}/>
                    </div>
                </div>
            ))}
             <button onClick={addAction} className="mt-4 text-indigo-400 hover:text-indigo-300 font-semibold">+ Añadir acción</button>
        </Section>
    )
};
const D6_Implementation = ({ data, onUpdate }) => (
    <Section title="D6: Implementar y Validar las Acciones" description="Ejecuta las PCAs y comprueba que son efectivas.">
        <InputField label="Resumen de la Implementación" value={data.summary || ''} onChange={(e) => onUpdate('d6_implementation', { ...data, summary: e.target.value })} placeholder="Describe cómo se implementaron las acciones..."/>
        <InputField label="Resultados de la Validación" value={data.validation_results || ''} onChange={(e) => onUpdate('d6_implementation', { ...data, validation_results: e.target.value })} placeholder="Muestra datos que confirmen la solución del problema..."/>
    </Section>
);
const D7_Prevention = ({ data, onUpdate }) => (
    <Section title="D7: Prevenir la Recurrencia" description="Modifica sistemas, políticas y procedimientos para evitar que el problema vuelva a ocurrir.">
         <InputField label="Documentos Actualizados" value={data.updated_docs || ''} onChange={(e) => onUpdate('d7_prevention', { ...data, updated_docs: e.target.value })} placeholder="Ej: FMEA, Plan de Control, SOPs..."/>
        <InputField label="Nuevos Estándares Creados" value={data.new_standards || ''} onChange={(e) => onUpdate('d7_prevention', { ...data, new_standards: e.target.value })} placeholder="Describe los nuevos estándares o prácticas..."/>
    </Section>
);
const D8_Recognition = ({ data, onUpdate }) => (
    <Section title="D8: Reconocer al Equipo" description="Felicita y reconoce el esfuerzo y éxito del equipo.">
        <InputField label="Resumen del Reconocimiento" value={data.summary || ''} onChange={(e) => onUpdate('d8_recognition', { ...data, summary: e.target.value })} placeholder="Describe cómo se reconoció al equipo..."/>
        <InputField label="Fecha de Celebración" type="date" value={data.celebration_date || ''} onChange={(e) => onUpdate('d8_recognition', { ...data, celebration_date: e.target.value })} />
    </Section>
);
