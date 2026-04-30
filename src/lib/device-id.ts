export function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let id = localStorage.getItem('doculearn_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('doculearn_device_id', id);
  }
  return id;
}
