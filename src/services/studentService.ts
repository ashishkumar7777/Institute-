import { supabase } from './supabase';

export interface StudentPayload {
  name: string;
  phone: string;
  pin: string;
  instituteId: string;
  enrolledSubjects: string[];
  feeStatus?: 'PAID' | 'UNPAID';
}

export const onboardNewStudent = async (payload: StudentPayload) => {
  const { data, error } = await supabase.rpc('onboard_student', {
    p_name: payload.name.trim(),
    p_phone: payload.phone.trim(),
    p_pin: payload.pin.trim(),
    p_institute_id: payload.instituteId,
    p_enrolled_subjects: payload.enrolledSubjects,
    p_fee_status: payload.feeStatus || 'PAID',
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const fetchInstituteStudents = async (instituteId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('institute_id', instituteId)
    .eq('role', 'student')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};