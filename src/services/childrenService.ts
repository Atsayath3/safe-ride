import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ChildProfile {
  id: string;
  fullName: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  schoolName: string;
  schoolLocation: { lat: number; lng: number; address: string };
  tripStartLocation: { lat: number; lng: number; address: string };
  studentId: string;
  avatar?: string;
  parentId: string;
}

export class ChildrenService {
  /**
   * Get all children for a parent with their school locations
   */
  static async getChildrenWithLocations(parentId: string): Promise<ChildProfile[]> {
    try {
      const childrenQuery = query(
        collection(db, 'children'),
        where('parentId', '==', parentId)
      );
      
      const snapshot = await getDocs(childrenQuery);
      const children: ChildProfile[] = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        children.push({
          id: doc.id,
          fullName: data.fullName,
          dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
          gender: data.gender,
          schoolName: data.schoolName,
          schoolLocation: data.schoolLocation,
          tripStartLocation: data.tripStartLocation,
          studentId: data.studentId,
          avatar: data.avatar,
          parentId: data.parentId
        });
      });
      
      return children;
    } catch (error) {
      console.error('Error fetching children with locations:', error);
      throw error;
    }
  }

  /**
   * Get specific children by their IDs with locations
   */
  static async getChildrenByIds(childIds: string[]): Promise<ChildProfile[]> {
    try {
      const children: ChildProfile[] = [];
      
      for (const childId of childIds) {
        const childDoc = await getDoc(doc(db, 'children', childId));
        if (childDoc.exists()) {
          const data = childDoc.data();
          children.push({
            id: childDoc.id,
            fullName: data.fullName,
            dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
            gender: data.gender,
            schoolName: data.schoolName,
            schoolLocation: data.schoolLocation,
            tripStartLocation: data.tripStartLocation,
            studentId: data.studentId,
            avatar: data.avatar,
            parentId: data.parentId
          });
        }
      }
      
      return children;
    } catch (error) {
      console.error('Error fetching children by IDs:', error);
      throw error;
    }
  }

  /**
   * Group children by their schools
   */
  static groupChildrenBySchool(children: ChildProfile[]): Map<string, ChildProfile[]> {
    const schoolGroups = new Map<string, ChildProfile[]>();
    
    children.forEach(child => {
      const schoolKey = `${child.schoolName}-${child.schoolLocation.lat}-${child.schoolLocation.lng}`;
      
      if (!schoolGroups.has(schoolKey)) {
        schoolGroups.set(schoolKey, []);
      }
      
      schoolGroups.get(schoolKey)!.push(child);
    });
    
    return schoolGroups;
  }

  /**
   * Get unique schools from a list of children
   */
  static getUniqueSchools(children: ChildProfile[]): Array<{
    name: string;
    location: { lat: number; lng: number; address: string };
    childrenCount: number;
    children: ChildProfile[];
  }> {
    const schoolGroups = this.groupChildrenBySchool(children);
    const uniqueSchools: Array<{
      name: string;
      location: { lat: number; lng: number; address: string };
      childrenCount: number;
      children: ChildProfile[];
    }> = [];
    
    schoolGroups.forEach((children, schoolKey) => {
      const firstChild = children[0];
      uniqueSchools.push({
        name: firstChild.schoolName,
        location: firstChild.schoolLocation,
        childrenCount: children.length,
        children: children
      });
    });
    
    return uniqueSchools;
  }

  /**
   * Check if children go to different schools
   */
  static checkMultipleSchools(childIds: string[], allChildren: ChildProfile[]): {
    hasMultipleSchools: boolean;
    schools: Array<{ name: string; location: { lat: number; lng: number; address: string } }>;
    childrenBySchool: Map<string, ChildProfile[]>;
  } {
    const selectedChildren = allChildren.filter(child => childIds.includes(child.id));
    const schoolGroups = this.groupChildrenBySchool(selectedChildren);
    
    const schools = Array.from(schoolGroups.entries()).map(([schoolKey, children]) => {
      const firstChild = children[0];
      return {
        name: firstChild.schoolName,
        location: firstChild.schoolLocation
      };
    });
    
    return {
      hasMultipleSchools: schools.length > 1,
      schools: schools,
      childrenBySchool: schoolGroups
    };
  }
}