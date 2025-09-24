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

interface SiblingCoordinationProps {
  parentId: string;
  children: { id: string; name: string; school: string }[];
}

export const SiblingCoordination: React.FC<SiblingCoordinationProps> = ({ parentId, children }) => {
  const [siblingGroups, setSiblingGroups] = useState<SiblingGroup[]>([]);
  const [groupRides, setGroupRides] = useState<GroupRideRequest[]>([]);
  const [childrenWithLocations, setChildrenWithLocations] = useState<ChildProfile[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<SiblingGroup | null>(null);
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
      // Auto-set pickup location from the first selected child that has a valid address
      const selectedChildrenData = childrenWithLocations.filter(c => selectedChildren.includes(c.id));
      const childWithPickup = selectedChildrenData.find(child => 
        child.tripStartLocation?.address && 
        child.tripStartLocation.address !== 'Pickup location not set'
      );
      
      if (childWithPickup) {
        setPickupLocation(childWithPickup.tripStartLocation.address);
      } else if (selectedChildrenData.length > 0) {
        // If no valid pickup location, clear the field and let user enter it
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

  const bookGroupRide = async (group: SiblingGroup) => {
    const groupChildren = children.filter(child => group.childIds.includes(child.id));
    
    try {
      if (group.allowMultipleDestinations && group.childDestinations) {
        // Handle multiple schools
        const childrenWithSchools = groupChildren.map(child => {
          const schoolInfo = group.childDestinations?.find(dest => dest.childId === child.id);
          return {
            childId: child.id,
            childName: child.name,
            schoolName: schoolInfo?.schoolName || child.school,
            schoolAddress: schoolInfo?.schoolAddress || `${child.school} Address`
          };
        });

        await SiblingCoordinationService.createMultiDestinationGroupRide(
          group.id,
          parentId,
          new Date(),
          group.defaultPickupLocation,
          childrenWithSchools
        );
      } else {
        // Handle single destination
        const estimatedCost = 1500;
        const costSplit = SiblingCoordinationService.calculateCostSplit(
          estimatedCost,
          groupChildren.map(child => ({ childId: child.id, childName: child.name })),
          group.costSplitMethod === 'distance_based' ? 'equal' : group.costSplitMethod
        );

        await SiblingCoordinationService.createGroupRideRequest({
          siblingGroupId: group.id,
          parentId,
          scheduledDate: new Date(),
          pickupLocation: group.defaultPickupLocation,
          dropoffLocation: group.defaultDropoffLocation,
          isMultiDestination: false,
          children: groupChildren.map(child => ({
            childId: child.id,
            childName: child.name
          })),
          costSplit,
          status: 'pending'
        });
      }

      toast({
        title: "Success",
        description: group.allowMultipleDestinations ? 
          "Multi-school group ride booked successfully" : 
          "Group ride booked successfully"
      });

      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to book group ride",
        variant: "destructive"
      });
    }
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
            <DialogHeader>
              <DialogTitle>Create Sibling Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g., School Group, Evening Classes"
                />
              </div>
              
              <div>
                <Label>Select Children (minimum 2)</Label>
                {loading && (
                  <div className="text-sm text-gray-500 mt-2">Loading children...</div>
                )}
                {!loading && childrenWithLocations.length === 0 && children.length === 0 && (
                  <div className="text-sm text-gray-500 mt-2">No children found. Please add children to your account first.</div>
                )}
                <div className="space-y-2 mt-2">
                  {/* Use children from props for simple display, enhanced data from service for features */}
                  {children.map(child => {
                    const isSelected = selectedChildren.includes(child.id);
                    const enhancedChild = childrenWithLocations.find(c => c.id === child.id);
                    
                    return (
                      <label key={child.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
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
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{child.name}</div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <School className="h-3 w-3" />
                            <span>{child.school}</span>
                          </div>
                          {enhancedChild?.schoolLocation?.address && enhancedChild.schoolLocation.address !== 'School location not available' && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3" />
                              <span>{enhancedChild.schoolLocation.address}</span>
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <div className="text-blue-600">
                            ✓
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
                
                {/* School Information Summary */}
                {selectedChildren.length >= 2 && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-sm text-blue-900">
                        Group Summary: {selectedChildren.length} children selected
                      </span>
                    </div>
                    
                    <div className="text-xs text-blue-700">
                      {/* Simple summary based on selected children */}
                      {selectedChildren.map(childId => {
                        const child = children.find(c => c.id === childId);
                        return child ? (
                          <div key={childId} className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span>{child.name} → {child.school}</span>
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
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Multiple schools detected. Route will include {selectedSchools.length} stops.
                        </div>
                      ) : (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                          ✓ All children go to the same school: {selectedSchools[0]}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Pickup Location - Auto-detected from children */}
              {selectedChildren.length > 0 && (
                <div className={`p-3 rounded-lg border ${pickupLocation ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Pickup Location</span>
                  </div>
                  {pickupLocation ? (
                    <>
                      <div className="text-sm text-blue-900 font-medium">
                        {pickupLocation}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        ✓ Auto-detected from selected children's profiles
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-amber-700">
                      ⚠️ No pickup location found in children's profiles. Please ensure children have pickup addresses set.
                    </div>
                  )}
                </div>
              )}

              {/* Drop-off Information */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <School className="h-4 w-4" />
                  <span className="font-medium">Drop-off locations detected automatically from children's schools</span>
                </div>
                <div className="text-xs text-green-600 mt-1">
                  No need to enter drop-off addresses - we'll use each child's school location
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredTime">Preferred Time</Label>
                  <Input
                    id="preferredTime"
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Cost Split Method</Label>
                  <Select value={costSplitMethod} onValueChange={(value: any) => setCostSplitMethod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Equal Split</SelectItem>
                      <SelectItem value="distance_based">Distance Based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>



              <Button onClick={createSiblingGroup} className="w-full">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sibling Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {siblingGroups.map(group => (
          <Card key={group.id} className="border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{group.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => bookGroupRide(group)}>
                    <Calendar className="w-4 h-4 mr-1" />
                    Book Ride
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
    </div>
  );
};