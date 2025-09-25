import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from '../../hooks/use-toast';
import { Users, Plus, Edit, Trash2, Calendar, DollarSign, MapPin, School, AlertCircle } from 'lucide-react';
import { SiblingGroup, GroupRideRequest } from '../../interfaces/personalization';
import { SiblingCoordinationService } from '../../services/siblingCoordinationService';
import { ChildrenService, ChildProfile } from '../../services/childrenService';
import SiblingGroupDriverSelectionModal from './SiblingGroupDriverSelectionModal';
import SiblingGroupBookingConfirmationModal from './SiblingGroupBookingConfirmationModal';
import { UserProfile } from '../../contexts/AuthContext';

interface SiblingCoordinationProps {
  parentId: string;
  children: { id: string; name: string; school: string }[];
  homeLocation?: { lat: number; lng: number; address: string } | null;
}

export const SiblingCoordination: React.FC<SiblingCoordinationProps> = ({ parentId, children, homeLocation }) => {
  const [siblingGroups, setSiblingGroups] = useState<SiblingGroup[]>([]);
  const [groupRides, setGroupRides] = useState<GroupRideRequest[]>([]);
  const [childrenWithLocations, setChildrenWithLocations] = useState<ChildProfile[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDriverSelectionOpen, setIsDriverSelectionOpen] = useState(false);
  const [isBookingConfirmationOpen, setIsBookingConfirmationOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SiblingGroup | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<SiblingGroup | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [groupName, setGroupName] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [costSplitMethod, setCostSplitMethod] = useState<'equal' | 'weighted' | 'distance_based' | 'custom'>('equal');
  const [allowMultipleDestinations, setAllowMultipleDestinations] = useState(false);
  const [childDestinations, setChildDestinations] = useState<{[childId: string]: {schoolName: string, schoolAddress: string}}>({});
  
  // Auto-detected school information
  const [schoolInfo, setSchoolInfo] = useState<{
    hasMultipleSchools: boolean;
    schools: Array<{ name: string; location: { lat: number; lng: number; address: string } }>;
    childrenBySchool: Map<string, ChildProfile[]>;
  }>({ hasMultipleSchools: false, schools: [], childrenBySchool: new Map() });

  useEffect(() => {
    loadData();
  }, [parentId]);

  // Auto-detect school information and pickup location when children selection changes
  useEffect(() => {
    if (selectedChildren.length >= 1 && childrenWithLocations.length > 0) {
      // Auto-set pickup location from the selected child's home location
      const selectedChildrenData = childrenWithLocations.filter(c => selectedChildren.includes(c.id));
      
      if (selectedChildrenData.length > 0) {
        // Use the first selected child's home location as pickup location
        const firstSelectedChild = selectedChildrenData[0];
        
        // Try to get child's home location first (stored during registration)
        if (firstSelectedChild.homeLocation?.address) {
          setPickupLocation(firstSelectedChild.homeLocation.address);
        } 
        // Fallback to child's trip start location if available
        else if (firstSelectedChild.tripStartLocation?.address && 
                 firstSelectedChild.tripStartLocation.address !== 'Pickup location not set') {
          setPickupLocation(firstSelectedChild.tripStartLocation.address);
        } 
        // Fallback to parent's home location as last resort
        else if (homeLocation?.address) {
          setPickupLocation(homeLocation.address);
        } 
        else {
          setPickupLocation('');
        }
      } else {
        setPickupLocation('');
      }
      
      if (selectedChildren.length >= 2) {
        const detectedInfo = ChildrenService.checkMultipleSchools(selectedChildren, childrenWithLocations);
        setSchoolInfo(detectedInfo);
        setAllowMultipleDestinations(detectedInfo.hasMultipleSchools);
        
        // If multiple schools detected, auto-populate child destinations
        if (detectedInfo.hasMultipleSchools) {
          const newChildDestinations: {[childId: string]: {schoolName: string, schoolAddress: string}} = {};
          selectedChildren.forEach(childId => {
            const child = childrenWithLocations.find(c => c.id === childId);
            if (child) {
              newChildDestinations[childId] = {
                schoolName: child.schoolName,
                schoolAddress: child.schoolLocation.address
              };
            }
          });
          setChildDestinations(newChildDestinations);
        }
      }
    } else {
      setSchoolInfo({ hasMultipleSchools: false, schools: [], childrenBySchool: new Map() });
      setAllowMultipleDestinations(false);
      setChildDestinations({});
      if (selectedChildren.length === 0) {
        setPickupLocation(''); // Clear pickup location if no children selected
      }
    }
  }, [selectedChildren, childrenWithLocations]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groups, rides, childrenData] = await Promise.all([
        SiblingCoordinationService.getSiblingGroups(parentId),
        SiblingCoordinationService.getGroupRideRequests(parentId),
        ChildrenService.getChildrenWithLocations(parentId)
      ]);
      
      console.log('Loaded data:', {
        groups: groups.length,
        rides: rides.length,
        childrenData: childrenData.length,
        propsChildren: children.length
      });
      
      setSiblingGroups(groups);
      setGroupRides(rides);
      setChildrenWithLocations(childrenData);
    } catch (error) {
      console.error('Error loading sibling coordination data:', error);
      toast({
        title: "Error",
        description: "Failed to load sibling coordination data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSiblingGroup = async () => {
    if (!groupName || selectedChildren.length < 2) {
      toast({
        title: "Validation Error",
        description: "Group name and at least 2 children are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const groupData = {
        name: groupName,
        childIds: selectedChildren,
        defaultPickupLocation: pickupLocation,
        defaultDropoffLocation: 'Auto-detected from schools',
        allowMultipleDestinations,
        childDestinations: allowMultipleDestinations ? 
          selectedChildren.map(childId => ({
            childId,
            schoolName: childDestinations[childId]?.schoolName || '',
            schoolAddress: childDestinations[childId]?.schoolAddress || '',
          })) : undefined,
        preferredTime,
        costSplitMethod,
        routeType: allowMultipleDestinations ? 'multiple_destinations' as const : 'single_destination' as const,
        isActive: true
      };

      await SiblingCoordinationService.createSiblingGroup(parentId, groupData);

      toast({
        title: "Success",
        description: "Sibling group created successfully"
      });

      // Reset form
      setGroupName('');
      setSelectedChildren([]);
      setPickupLocation('');
      setPreferredTime('');
      setCostSplitMethod('equal');
      setAllowMultipleDestinations(false);
      setChildDestinations({});
      setIsCreateModalOpen(false);
      
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sibling group",
        variant: "destructive"
      });
    }
  };

  const bookGroupRide = (group: SiblingGroup) => {
    setSelectedGroup(group);
    setIsDriverSelectionOpen(true);
  };

  const handleDriverSelect = (driver: UserProfile) => {
    setSelectedDriver(driver);
    setIsDriverSelectionOpen(false);
    setIsBookingConfirmationOpen(true);
  };

  const handleBookingComplete = () => {
    setIsBookingConfirmationOpen(false);
    setSelectedGroup(null);
    setSelectedDriver(null);
    loadData(); // Refresh the data
  };

  const handleCloseDriverSelection = () => {
    setIsDriverSelectionOpen(false);
    setSelectedGroup(null);
  };

  const handleCloseBookingConfirmation = () => {
    setIsBookingConfirmationOpen(false);
    setSelectedGroup(null);
    setSelectedDriver(null);
  };

  const getChildName = (childId: string) => {
    return children.find(child => child.id === childId)?.name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteGroup = (group: SiblingGroup) => {
    setGroupToDelete(group);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await SiblingCoordinationService.deleteSiblingGroup(groupToDelete.id);
      
      toast({
        title: "Success",
        description: "Sibling group deleted successfully"
      });

      setIsDeleteModalOpen(false);
      setGroupToDelete(null);
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sibling group",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-4">Loading sibling coordination...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Sibling Coordination</h2>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Create Sibling Group
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Coordinate transportation for multiple children with shared pickup and drop-off locations.
              </p>
            </DialogHeader>
            <div className="space-y-6 py-6">
              <div>
                <Label htmlFor="groupName" className="text-base font-semibold text-gray-900">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., School Group, Evening Classes"
                  className="mt-2 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base"
                />
              </div>
              
              <div>
                <Label className="text-base font-semibold text-gray-900">Select Children (minimum 2)</Label>
                {loading && (
                  <div className="text-sm text-gray-600 mt-2 font-medium">Loading children...</div>
                )}
                {!loading && childrenWithLocations.length === 0 && children.length === 0 && (
                  <div className="text-sm text-gray-700 mt-2 font-medium p-3 bg-gray-100 rounded border">No children found. Please add children to your account first.</div>
                )}
                <div className="space-y-3 mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {/* Use children from props for simple display, enhanced data from service for features */}
                  {children.map(child => {
                    const isSelected = selectedChildren.includes(child.id);
                    const enhancedChild = childrenWithLocations.find(c => c.id === child.id);
                    
                    return (
                      <label key={child.id} className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer shadow-sm ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-300 bg-white hover:border-blue-300 hover:shadow-md'}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChildren([...selectedChildren, child.id]);
                            } else {
                              setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                            }
                          }}
                          className="w-5 h-5 text-blue-600 border-gray-400 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 text-lg">{child.name}</div>
                          <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
                            <School className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{child.school}</span>
                          </div>
                          {enhancedChild?.schoolLocation?.address && enhancedChild.schoolLocation.address !== 'School location not available' && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mt-2">
                              <MapPin className="h-3 w-3 text-gray-500" />
                              <span><span className="font-medium">School:</span> {enhancedChild.schoolLocation.address}</span>
                            </div>
                          )}
                          {enhancedChild?.homeLocation?.address && (
                            <div className="flex items-center gap-1 text-xs text-green-700 mt-1">
                              <MapPin className="h-3 w-3 text-green-600" />
                              <span><span className="font-medium">Home:</span> {enhancedChild.homeLocation.address}</span>
                            </div>
                          )}
                          {isSelected && selectedChildren[0] === child.id && (
                            <div className="text-xs text-blue-700 mt-2 font-semibold bg-blue-100 px-2 py-1 rounded-md inline-flex items-center gap-1">
                              📍 Using this child's home as pickup location
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-blue-600 bg-blue-100 p-2 rounded-full">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                
                {/* School Information Summary */}
                {selectedChildren.length >= 2 && (
                  <div className="mt-6 p-4 rounded-lg bg-blue-50 border-2 border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-base text-blue-900">
                        Group Summary: {selectedChildren.length} children selected
                      </span>
                    </div>
                    
                    <div className="text-sm text-blue-800 space-y-2">
                      {/* Simple summary based on selected children */}
                      {selectedChildren.map(childId => {
                        const child = children.find(c => c.id === childId);
                        return child ? (
                          <div key={childId} className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <span className="font-medium">{child.name}</span>
                            <span className="text-blue-700">→</span>
                            <span>{child.school}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                    
                    {/* Check if children go to different schools */}
                    {(() => {
                      const selectedSchools = [...new Set(selectedChildren.map(childId => {
                        const child = children.find(c => c.id === childId);
                        return child?.school;
                      }).filter(Boolean))];
                      
                      return selectedSchools.length > 1 ? (
                        <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-md text-sm text-amber-800">
                          <AlertCircle className="h-4 w-4 inline mr-2" />
                          <span className="font-semibold">Multiple schools detected.</span> Route will include {selectedSchools.length} stops.
                        </div>
                      ) : (
                        <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-md text-sm text-green-800">
                          <svg className="h-4 w-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">All children go to the same school:</span> {selectedSchools[0]}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Pickup Location - Auto-detected from children */}
              {selectedChildren.length > 0 && (
                <div className={`p-4 rounded-lg border-2 shadow-sm ${pickupLocation ? 'bg-blue-50 border-blue-300' : 'bg-amber-50 border-amber-300'}`}>
                  <div className="flex items-center gap-2 text-base mb-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">Pickup Location</span>
                  </div>
                  {pickupLocation ? (
                    <>
                      <div className="text-sm text-blue-900 font-semibold bg-white p-2 rounded border">
                        {pickupLocation}
                      </div>
                      <div className="text-sm text-blue-700 mt-2 font-medium">
                        ✓ Using <span className="font-semibold">{selectedChildren.length > 0 && childrenWithLocations.find(c => c.id === selectedChildren[0])?.fullName || 'first selected child'}'s</span> home location as pickup point
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-amber-800 font-medium">
                      ⚠️ No home location found for selected children. Please ensure children have home addresses set.
                    </div>
                  )}
                </div>
              )}

              {/* Drop-off Information */}
              <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 text-base text-green-800 mb-2">
                  <School className="h-5 w-5 text-green-600" />
                  <span className="font-semibold">Drop-off locations detected automatically</span>
                </div>
                <div className="text-sm text-green-700 font-medium">
                  No need to enter drop-off addresses - we'll use each child's school location
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <Label htmlFor="preferredTime" className="text-base font-semibold text-gray-900">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="mt-2 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <Label className="text-base font-semibold text-gray-900">Cost Split Method</Label>
                  <Select value={costSplitMethod} onValueChange={(value: any) => setCostSplitMethod(value)}>
                    <SelectTrigger className="mt-2 border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal Split</SelectItem>
                      <SelectItem value="distance_based">Distance Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>



              <Button 
                onClick={createSiblingGroup} 
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={!groupName || selectedChildren.length < 2}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Sibling Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sibling Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {siblingGroups.map(group => (
          <Card key={group.id} className="border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">{group.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => bookGroupRide(group)} className="hover:bg-blue-50">
                    <Calendar className="w-4 h-4 mr-1" />
                    Book Ride
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDeleteGroup(group)}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    title="Delete group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Children:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {group.childIds.map(childId => (
                      <Badge key={childId} variant="secondary">
                        {getChildName(childId)}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Route:</p>
                  {group.allowMultipleDestinations ? (
                    <div className="space-y-1">
                      <p className="text-sm text-blue-600 font-medium">📍 Multiple Destinations</p>
                      <p className="text-xs text-gray-600">Pickup: {group.defaultPickupLocation}</p>
                      {group.childDestinations && group.childDestinations.length > 0 ? (
                        <div className="text-xs text-gray-600">
                          <p>Schools:</p>
                          <ul className="list-disc list-inside ml-2">
                            {group.childDestinations.map(dest => (
                              <li key={dest.childId}>
                                {getChildName(dest.childId)} → {dest.schoolName}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Individual school details</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {group.defaultPickupLocation} → {group.defaultDropoffLocation}
                    </p>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium">Preferred Time:</p>
                  <p className="text-sm text-gray-600">{group.preferredTime}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium">Cost Split:</p>
                  <p className="text-sm text-gray-600 capitalize">{group.costSplitMethod} split</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {siblingGroups.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sibling Groups</h3>
            <p className="text-gray-600 mb-4">Create groups to coordinate rides for multiple children</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Group Rides */}
      {groupRides.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Group Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupRides.slice(0, 5).map(ride => {
                const group = siblingGroups.find(g => g.id === ride.siblingGroupId);
                return (
                  <div key={ride.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{group?.name}</p>
                      <p className="text-sm text-gray-600">
                        {ride.scheduledDate.toLocaleDateString()} at {ride.scheduledDate.toLocaleTimeString()}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {ride.children.map(child => (
                          <Badge key={child.childId} variant="outline" className="text-xs">
                            {child.childName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(ride.status)}>
                        {ride.status}
                      </Badge>
                      {ride.totalCost && (
                        <p className="text-sm text-gray-600 mt-1">
                          LKR {ride.totalCost}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Sibling Group
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the sibling group 
              <span className="font-semibold text-gray-900"> "{groupToDelete?.name}"</span>?
            </p>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone. The group and its settings will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setGroupToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteGroup}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Selection Modal for Sibling Groups */}
      {selectedGroup && (
        <SiblingGroupDriverSelectionModal
          isOpen={isDriverSelectionOpen}
          onClose={handleCloseDriverSelection}
          siblingGroup={selectedGroup}
          children={children}
          onDriverSelect={handleDriverSelect}
        />
      )}

      {/* Booking Confirmation Modal for Sibling Groups */}
      {selectedGroup && selectedDriver && (
        <SiblingGroupBookingConfirmationModal
          isOpen={isBookingConfirmationOpen}
          onClose={handleCloseBookingConfirmation}
          driver={selectedDriver}
          siblingGroup={selectedGroup}
          children={children}
          onBookingComplete={handleBookingComplete}
        />
      )}
    </div>
  );
};