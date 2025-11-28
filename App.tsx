import React, { useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import SkuSelector from './components/SkuSelector';
import VeoGenerator from './components/VeoGenerator';
import { Device, SkuType, ViewMode, SkuTarget } from './types';
import { Search, RotateCw, ChevronRight, FileDown, Layers, List, CheckSquare, Edit, CheckCircle, ChevronDown, ChevronUp, Calendar, Cpu, Wifi, WifiOff, Filter } from 'lucide-react';

// Mock Data
const INITIAL_DEVICES: Device[] = [
  { id: '1', name: 'TPE-POS-01', sku: SkuType.BASE, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0071af34', status: 'Connected', group: 'Taipei Store' },
  { id: '2', name: 'TPE-POS-02', sku: SkuType.BASE, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0082bf36', status: 'Connected', group: 'Taipei Store' },
  { id: '3', name: 'TPE-POS-03', sku: SkuType.BASE, os: 'Windows', model: 'Intel NUC', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0093cf47', status: 'Connected', group: 'Taipei Store' },
  { id: '4', name: 'TPE-POS-04', sku: SkuType.BASE, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0093cf47', status: 'Connected', group: 'Taipei Store' },
  { id: '10', name: 'TPE-POS-05', sku: SkuType.BASE, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0093cf48', status: 'Connected', group: 'Taipei Store' },
  { id: '5', name: 'LA-Kiosk-01', sku: SkuType.PRIME, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '00a4df58', status: 'Disconnected', group: 'LA Store' },
  { id: '6', name: 'LA-Kiosk-02', sku: SkuType.PRIME, os: 'Windows', model: 'Surface Pro', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '00b5ef69', status: 'Connected', group: 'LA Store' },
  { id: '7', name: 'LA-POS_test', sku: SkuType.PRIME, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '00568f36', status: 'Connected', group: 'LA Store' },
  { id: '8', name: 'DESKTOP-SASDEW', sku: SkuType.PREMIUM, os: 'Windows', model: 'Dell OptiPlex', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '00568f36', status: 'Connected', group: 'HQ Office' },
  { id: '9', name: 'DESKTOP-SAEQRT', sku: SkuType.PREMIUM, os: 'Android', model: 'VirtualBox', sn: 'ADFW4654ETWG3', agentVer: '1.0.23', deviceId: '0045bf95', status: 'Connected', group: 'HQ Office' },
];

// Constants for Licenses
const LICENSES = {
  OTA_PURCHASED: 10000,
  OTA_USED: 6500,
  PRIME_TOTAL: 20,
  PREMIUM_TOTAL: 20,
  NEXT_BILLING: 'Oct 1, 2024'
};

type DeviceViewType = 'LIST' | 'GROUPS';
type TabType = 'ALL' | 'BASE' | 'PRIME' | 'PREMIUM';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('DEVICES');
  const [deviceViewType, setDeviceViewType] = useState<DeviceViewType>('LIST');
  const [devices, setDevices] = useState<Device[]>(INITIAL_DEVICES);
  
  // Filtering State
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [filterOS, setFilterOS] = useState<string>('All');
  const [filterSKU, setFilterSKU] = useState<string>('All');

  // Selection State
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [skuTarget, setSkuTarget] = useState<SkuTarget | null>(null);
  const [notification, setNotification] = useState<{message: string, subtext?: string} | null>(null);

  // --- Derived Data Calculation ---

  // 1. Filter Devices List
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      // Tab Filter
      if (activeTab !== 'ALL' && d.sku !== activeTab) return false;
      // Dropdown OS
      if (filterOS !== 'All' && d.os !== filterOS) return false;
      // Dropdown SKU (Redundant if Tab is selected, but good for "All" tab)
      if (filterSKU !== 'All' && d.sku !== filterSKU) return false;
      return true;
    });
  }, [devices, activeTab, filterOS, filterSKU]);

  // 2. Group Data Calculation
  // We compute groups based on the *filtered* devices to show accurate counts for the current filter view
  const groups = useMemo(() => {
    const groupMap = new Map<string, Device[]>();
    
    // Initialize groups from all devices to ensure we list them even if empty (optional, but let's show only active matching groups)
    filteredDevices.forEach(d => {
      const list = groupMap.get(d.group) || [];
      list.push(d);
      groupMap.set(d.group, list);
    });

    return Array.from(groupMap.entries()).map(([name, groupDevices]) => ({
      name,
      devices: groupDevices,
      count: groupDevices.length,
      baseCount: groupDevices.filter(d => d.sku === SkuType.BASE).length,
      primeCount: groupDevices.filter(d => d.sku === SkuType.PRIME).length,
      premiumCount: groupDevices.filter(d => d.sku === SkuType.PREMIUM).length,
    }));
  }, [filteredDevices]);

  // KPI Stats Calculation
  const stats = useMemo(() => {
    const baseCount = devices.filter(d => d.sku === SkuType.BASE).length;
    const primeCount = devices.filter(d => d.sku === SkuType.PRIME).length;
    const premiumCount = devices.filter(d => d.sku === SkuType.PREMIUM).length;
    return { baseCount, primeCount, premiumCount };
  }, [devices]);

  // --- Handlers ---

  const toggleDeviceSelection = (id: string) => {
    const newSet = new Set(selectedDeviceIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedDeviceIds(newSet);
  };

  const toggleAllDevices = () => {
    if (selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0) {
      setSelectedDeviceIds(new Set());
    } else {
      setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
    }
  };

  const toggleGroupSelection = (groupName: string) => {
    const newSet = new Set(selectedGroups);
    if (newSet.has(groupName)) newSet.delete(groupName);
    else newSet.add(groupName);
    setSelectedGroups(newSet);
  };

  const toggleAllGroups = () => {
    if (selectedGroups.size === groups.length && groups.length > 0) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(groups.map(g => g.name)));
    }
  };

  const toggleGroupExpand = (groupName: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(groupName)) newSet.delete(groupName);
    else newSet.add(groupName);
    setExpandedGroups(newSet);
  };

  // --- Modal & Action Handlers ---

  const openSingleDeviceModal = (device: Device) => {
    setSkuTarget({
      type: 'SINGLE',
      label: device.name,
      count: 1,
      currentSku: device.sku
    });
    setIsSkuModalOpen(true);
  };

  const openBulkDeviceModal = () => {
    setSkuTarget({
      type: 'MULTI',
      label: `${selectedDeviceIds.size} Devices`,
      count: selectedDeviceIds.size,
    });
    setIsSkuModalOpen(true);
  };

  const openGroupModal = () => {
    if (selectedGroups.size === 1) {
      const groupName = Array.from(selectedGroups)[0];
      const groupData = groups.find(g => g.name === groupName);
      setSkuTarget({
        type: 'GROUP',
        label: groupName,
        count: groupData?.count || 0
      });
    } else {
      const totalDevices = groups
        .filter(g => selectedGroups.has(g.name))
        .reduce((acc, g) => acc + g.count, 0);

      setSkuTarget({
        type: 'MULTI_GROUP',
        label: `${selectedGroups.size} Groups`,
        count: totalDevices
      });
    }
    setIsSkuModalOpen(true);
  };

  const handleSkuConfirm = (newSku: SkuType) => {
    if (!skuTarget) return;

    let updatedDevices = [...devices];
    let successMessage = "";
    let subtext = "";

    if (skuTarget.type === 'SINGLE') {
       updatedDevices = updatedDevices.map(d => d.name === skuTarget.label ? { ...d, sku: newSku } : d);
       successMessage = `Device Updated Successfully`;
       subtext = `${skuTarget.label} is now on ${newSku} plan`;
    } else if (skuTarget.type === 'MULTI') {
       updatedDevices = updatedDevices.map(d => selectedDeviceIds.has(d.id) ? { ...d, sku: newSku } : d);
       successMessage = `Bulk Update Successful`;
       subtext = `${skuTarget.count} devices upgraded to ${newSku}`;
       setSelectedDeviceIds(new Set());
    } else if (skuTarget.type === 'GROUP') {
       // Note: Applies to ALL devices in that group in the database, not just filtered ones
       updatedDevices = updatedDevices.map(d => d.group === skuTarget.label ? { ...d, sku: newSku } : d);
       successMessage = `Group Updated Successfully`;
       subtext = `All devices in ${skuTarget.label} set to ${newSku}`;
       setSelectedGroups(new Set());
    } else if (skuTarget.type === 'MULTI_GROUP') {
       updatedDevices = updatedDevices.map(d => selectedGroups.has(d.group) ? { ...d, sku: newSku } : d);
       successMessage = `Multiple Groups Updated`;
       subtext = `${selectedGroups.size} groups updated to ${newSku}`;
       setSelectedGroups(new Set());
    }

    setDevices(updatedDevices);
    setIsSkuModalOpen(false);
    setSkuTarget(null);

    setNotification({ message: successMessage, subtext });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Render Helpers ---

  const renderSkuBadge = (sku: SkuType) => {
    let bg = 'bg-gray-500';
    if (sku === SkuType.PRIME) bg = 'bg-[#3b8296]'; 
    if (sku === SkuType.PREMIUM) bg = 'bg-[#856434]'; 

    return (
      <span className={`${bg} text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm tracking-wide`}>
        {sku}
      </span>
    );
  };

  const renderKPIs = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6 pt-6">
      
      {/* Base Plan Card */}
      <div className="bg-[#232428] p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-gray-400 font-medium text-sm">Base Plan</h3>
          <span className="text-xs text-cyan-400 flex items-center gap-1 cursor-pointer hover:underline">View <ChevronRight size={10}/></span>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-3xl font-bold text-white">{stats.baseCount}</span>
          <span className="text-sm text-gray-500">devices</span>
        </div>
        
        <div className="space-y-2 mt-4 text-xs">
          <div className="flex justify-between text-gray-400">
             <span>OTA updates Purchased</span>
             <span className="text-white font-mono">{LICENSES.OTA_PURCHASED.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
             <span>OTA updates Used</span>
             <span className="text-white font-mono">{LICENSES.OTA_USED.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
             <span>OTA updates Available</span>
             <span className="text-white font-mono">{(LICENSES.OTA_PURCHASED - LICENSES.OTA_USED).toLocaleString()}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
            <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: `${(LICENSES.OTA_USED / LICENSES.OTA_PURCHASED) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Prime Plan Card */}
      <div className="bg-[#232428] p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium text-sm">Prime Plan</h3>
          <Cpu className="text-cyan-600/50" size={24} />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <Cpu size={24} className="text-cyan-500 mr-1" />
          <span className="text-3xl font-bold text-white">{stats.primeCount}</span>
          <span className="text-sm text-gray-500">devices</span>
        </div>
        <div className="text-xs text-gray-500 mb-6">
           Using {stats.primeCount} of {LICENSES.PRIME_TOTAL} licenses
        </div>
        
        <div className="border-t border-gray-700 pt-3 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>Next Billing: <span className="text-white">{LICENSES.NEXT_BILLING}</span></span>
          </div>
        </div>
      </div>

       {/* Premium Plan Card */}
       <div className="bg-[#232428] p-5 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 font-medium text-sm">Premium Plan</h3>
          <Cpu className="text-yellow-600/50" size={24} />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <Cpu size={24} className="text-yellow-500 mr-1" />
          <span className="text-3xl font-bold text-white">{stats.premiumCount}</span>
          <span className="text-sm text-gray-500">devices</span>
        </div>
        <div className="text-xs text-gray-500 mb-6">
           Using {stats.premiumCount} of {LICENSES.PREMIUM_TOTAL} licenses
        </div>
        
        <div className="border-t border-gray-700 pt-3 mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={12} />
            <span>Next Billing: <span className="text-white">{LICENSES.NEXT_BILLING}</span></span>
          </div>
        </div>
      </div>

    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#313338] font-sans text-gray-200">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Main Content Pane - Removed top breadcrumb container */}
        <div className="flex-1 bg-[#2b2d31] mx-6 my-6 rounded-t-lg overflow-hidden flex flex-col shadow-xl">
          
          {currentView === 'DEVICES' && (
            <>
              {/* Title & Header */}
              <div className="px-6 pt-6 pb-2 border-b border-gray-700/50 bg-[#2b2d31]">
                <div className="flex justify-between items-center mb-4">
                  <h1 className="text-2xl font-semibold text-white">Plan Management</h1>
                  <button className="flex items-center gap-2 border border-cyan-500 text-cyan-400 px-4 py-2 rounded text-sm hover:bg-cyan-500/10 transition-colors">
                    <FileDown size={16} />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              {renderKPIs()}

              {/* Toolbar & Filters */}
              <div className="px-6 pb-0 bg-[#2b2d31] border-b border-gray-700 flex flex-col gap-4">
                 
                 <div className="flex justify-between items-end">
                    {/* Tabs */}
                    <div className="flex space-x-1">
                      {(['ALL', 'BASE', 'PRIME', 'PREMIUM'] as TabType[]).map(tab => (
                        <button
                          key={tab}
                          onClick={() => { setActiveTab(tab); setSelectedDeviceIds(new Set()); setSelectedGroups(new Set()); }}
                          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                            activeTab === tab 
                            ? 'border-cyan-400 text-cyan-400 bg-cyan-950/10' 
                            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800'
                          }`}
                        >
                          <span className="capitalize">{tab === 'ALL' ? 'All' : tab.toLowerCase()}</span> 
                          <span className="ml-2 text-xs opacity-70 bg-gray-700/50 px-1.5 rounded-full">
                            {tab === 'ALL' ? devices.length : devices.filter(d => d.sku === tab).length}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-[#1e1f22] p-1 rounded-lg border border-gray-700 mb-2">
                        <button 
                          onClick={() => { setDeviceViewType('LIST'); setSelectedGroups(new Set()); }}
                          className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${deviceViewType === 'LIST' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                          <List size={14} /> List
                        </button>
                        <button 
                          onClick={() => { setDeviceViewType('GROUPS'); setSelectedDeviceIds(new Set()); }}
                          className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-xs font-medium transition-all ${deviceViewType === 'GROUPS' ? 'bg-cyan-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                          <Layers size={14} /> Groups
                        </button>
                    </div>
                 </div>
              </div>

              {/* Action Bar OR Filter Bar */}
              {(selectedDeviceIds.size > 0 || selectedGroups.size > 0) ? (
                 <div className="px-6 py-3 bg-cyan-950/30 border-b border-cyan-900/50 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                      <CheckSquare size={18} className="text-cyan-400" />
                      <span className="text-sm text-cyan-100 font-medium">
                        {deviceViewType === 'LIST' ? `${selectedDeviceIds.size} devices selected` : `${selectedGroups.size} groups selected`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={deviceViewType === 'LIST' ? openBulkDeviceModal : openGroupModal}
                        className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors shadow-lg shadow-cyan-900/20"
                      >
                        <Edit size={14} /> Update SKU
                      </button>
                    </div>
                 </div>
              ) : (
                <div className="px-6 py-3 bg-[#232428] flex justify-between items-center border-b border-gray-800">
                  <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2 bg-[#1e1f22] border border-gray-700 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium px-1">OS</span>
                        <select 
                          value={filterOS}
                          onChange={(e) => setFilterOS(e.target.value)}
                          className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer py-0.5"
                        >
                          <option value="All">All</option>
                          <option value="Android">Android</option>
                          <option value="Windows">Windows</option>
                        </select>
                     </div>

                     <div className="flex items-center gap-2 bg-[#1e1f22] border border-gray-700 rounded-lg px-2 py-1">
                        <span className="text-xs text-gray-500 font-medium px-1">SKU</span>
                        <select 
                          value={filterSKU}
                          onChange={(e) => setFilterSKU(e.target.value)}
                          className="bg-transparent text-xs text-white border-none focus:ring-0 cursor-pointer py-0.5"
                        >
                          <option value="All">All</option>
                          <option value="BASE">Base</option>
                          <option value="PRIME">Prime</option>
                          <option value="PREMIUM">Premium</option>
                        </select>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Search size={18} className="text-gray-400 cursor-pointer hover:text-white" />
                    <RotateCw size={18} className="text-cyan-400 cursor-pointer hover:rotate-180 transition-transform" />
                  </div>
                </div>
              )}

              {/* Content Area */}
              <div className="flex-1 overflow-auto bg-[#232428]">
                
                {deviceViewType === 'LIST' ? (
                  /* Device List View */
                  <table className="w-full text-left border-collapse">
                    <thead className="text-xs text-gray-500 font-medium border-b border-gray-700 sticky top-0 bg-[#232428] z-10">
                      <tr>
                        <th className="px-6 py-4 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-600 bg-[#2b2d31] checked:bg-cyan-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                            checked={selectedDeviceIds.size === filteredDevices.length && filteredDevices.length > 0}
                            onChange={toggleAllDevices}
                          />
                        </th>
                        <th className="px-2 py-4 font-normal">Device Name</th>
                        <th className="px-6 py-4 font-normal">Group</th>
                        <th className="px-6 py-4 font-normal">SKU</th>
                        <th className="px-6 py-4 font-normal">OS</th>
                        <th className="px-6 py-4 font-normal">Model</th>
                        <th className="px-6 py-4 font-normal">SN</th>
                        <th className="px-6 py-4 font-normal text-right">Device ID</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredDevices.length > 0 ? filteredDevices.map((device) => (
                        <tr 
                          key={device.id} 
                          className={`border-b border-gray-800/50 hover:bg-[#2b2d31] transition-colors group ${selectedDeviceIds.has(device.id) ? 'bg-[#2b2d31]' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-600 bg-[#2b2d31] checked:bg-cyan-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                              checked={selectedDeviceIds.has(device.id)}
                              onChange={() => toggleDeviceSelection(device.id)}
                            />
                          </td>
                          <td className="px-2 py-4 text-cyan-400 font-medium">
                            <div className="flex items-center gap-2">
                               {device.status === 'Connected' ? <Wifi size={12} className="text-green-500"/> : <WifiOff size={12} className="text-gray-600"/>}
                               <button onClick={() => openSingleDeviceModal(device)} className="hover:underline decoration-cyan-400/50 underline-offset-4">
                                  {device.name}
                               </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-xs">{device.group}</td>
                          <td className="px-6 py-4">
                            {renderSkuBadge(device.sku)}
                          </td>
                          <td className="px-6 py-4 text-gray-300">{device.os}</td>
                          <td className="px-6 py-4 text-gray-300">{device.model}</td>
                          <td className="px-6 py-4 text-gray-300 font-mono text-xs">{device.sn}</td>
                          <td className="px-6 py-4 text-gray-300 text-right font-mono text-xs relative">
                            {device.deviceId}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={8} className="text-center py-10 text-gray-500">
                             No devices match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* Group View with Accordion */
                  <table className="w-full text-left border-collapse">
                    <thead className="text-xs text-gray-500 font-medium border-b border-gray-700 sticky top-0 bg-[#232428] z-10">
                      <tr>
                         <th className="px-6 py-4 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-600 bg-[#2b2d31] checked:bg-cyan-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                            checked={selectedGroups.size === groups.length && groups.length > 0}
                            onChange={toggleAllGroups}
                          />
                        </th>
                        <th className="px-2 py-4 font-normal">Group Name</th>
                        <th className="px-6 py-4 font-normal">Filtered Devices</th>
                        <th className="px-6 py-4 font-normal">Base</th>
                        <th className="px-6 py-4 font-normal">Prime</th>
                        <th className="px-6 py-4 font-normal">Premium</th>
                        <th className="px-6 py-4 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {groups.length > 0 ? groups.map((group) => (
                        <React.Fragment key={group.name}>
                          {/* Group Row */}
                          <tr 
                            className={`border-b border-gray-800/50 hover:bg-[#2b2d31] transition-colors ${selectedGroups.has(group.name) ? 'bg-[#2b2d31]' : 'bg-[#26272b]'}`}
                          >
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-600 bg-[#2b2d31] checked:bg-cyan-500 focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                                checked={selectedGroups.has(group.name)}
                                onChange={() => toggleGroupSelection(group.name)}
                              />
                            </td>
                            <td className="px-2 py-4 text-white font-medium">
                               <button 
                                 onClick={() => toggleGroupExpand(group.name)}
                                 className="flex items-center gap-2 hover:text-cyan-400 transition-colors"
                               >
                                  {expandedGroups.has(group.name) ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                                  <Layers size={16} className="text-gray-500" />
                                  {group.name}
                               </button>
                            </td>
                            <td className="px-6 py-4 text-gray-300">{group.count}</td>
                            <td className="px-6 py-4 text-gray-400">{group.baseCount}</td>
                            <td className="px-6 py-4 text-cyan-600">{group.primeCount}</td>
                            <td className="px-6 py-4 text-yellow-600">{group.premiumCount}</td>
                            <td className="px-6 py-4 text-right">
                               <button onClick={() => toggleGroupExpand(group.name)} className="text-xs text-gray-500 hover:text-cyan-400 underline">
                                 {expandedGroups.has(group.name) ? 'Hide Devices' : 'View Devices'}
                               </button>
                            </td>
                          </tr>
                          
                          {/* Expanded Child Rows */}
                          {expandedGroups.has(group.name) && (
                            <>
                              <tr className="bg-[#1e1f22]">
                                <td colSpan={7} className="px-0 py-0 border-b border-gray-800">
                                   <div className="pl-14 pr-6 py-4 bg-black/20 inner-shadow">
                                      <table className="w-full text-xs">
                                         <thead>
                                            <tr className="text-gray-500 border-b border-gray-800">
                                               <th className="pb-2 font-normal text-left">Device Name</th>
                                               <th className="pb-2 font-normal text-left">SKU</th>
                                               <th className="pb-2 font-normal text-left">OS</th>
                                               <th className="pb-2 font-normal text-left">Status</th>
                                            </tr>
                                         </thead>
                                         <tbody>
                                            {group.devices.map(d => (
                                              <tr key={d.id} className="border-b border-gray-800/50 last:border-0 hover:bg-white/5">
                                                 <td className="py-2.5 text-cyan-400/90">{d.name}</td>
                                                 <td className="py-2.5">{renderSkuBadge(d.sku)}</td>
                                                 <td className="py-2.5 text-gray-400">{d.os}</td>
                                                 <td className="py-2.5 text-gray-400 flex items-center gap-1">
                                                   {d.status === 'Connected' ? <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> : <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>}
                                                   {d.status}
                                                 </td>
                                              </tr>
                                            ))}
                                            {group.devices.length === 0 && (
                                              <tr><td colSpan={4} className="py-2 text-gray-600 italic">No devices match filter in this group</td></tr>
                                            )}
                                         </tbody>
                                      </table>
                                   </div>
                                </td>
                              </tr>
                            </>
                          )}
                        </React.Fragment>
                      )) : (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-gray-500">
                             No groups match the current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {currentView === 'VEO_STUDIO' && (
            <VeoGenerator />
          )}

           {currentView === 'DASHBOARD' && (
             <div className="flex items-center justify-center h-full text-gray-500">
               Dashboard View Placeholder
             </div>
           )}

        </div>
        
        {/* Notification Toast */}
        {notification && (
          <div className="absolute bottom-6 right-6 bg-[#2b2d31] border border-cyan-500/50 rounded-lg shadow-2xl p-4 flex items-start gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm z-50">
             <div className="bg-cyan-500/20 p-1.5 rounded-full mt-0.5">
               <CheckCircle size={20} className="text-cyan-400" />
             </div>
             <div>
               <h4 className="text-white font-medium text-sm">{notification.message}</h4>
               {notification.subtext && <p className="text-gray-400 text-xs mt-1">{notification.subtext}</p>}
             </div>
          </div>
        )}
      </div>

      {/* SKU Modal */}
      {skuTarget && (
        <SkuSelector 
          target={skuTarget}
          isOpen={isSkuModalOpen} 
          onClose={() => setIsSkuModalOpen(false)} 
          onConfirm={handleSkuConfirm} 
        />
      )}
    </div>
  );
};

export default App;