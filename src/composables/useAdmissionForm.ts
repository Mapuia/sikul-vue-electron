import { ref } from 'vue'

export const useAdmissionForm = () => {
  const classOptions = ['KG-I','KG-II', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX','X','XI']
  const sectionOptions = ['A', 'B']

  const form = ref({
    fullName: '',
    gender: '',
    dob: '',
    contactNumber: '',
    fathersName: '',
    mothersName: '',    
    address: '',
    apar: '',    
    aadhaar: '',
    pen: '',    
    caste: '',
    religion: '',
    height: '',
    weight: '',
    bloodGroup: '',
    className: '',
    section: ''
    
  })

  const message = ref('')

  const resetForm = () => {
    form.value = {
        fullName: '',
        gender: '',
        dob: '',
        contactNumber: '',
        fathersName: '',
        mothersName: '',    
        address: '',
        apar: '',    
        aadhaar: '',
        pen: '',    
        caste: '',
        religion: '',
        height: '',
        weight: '',
        bloodGroup: '',
        className: '',
        section: ''
    }
  }
//Except Class and Section will be inserten into Student's Table
//StudentID, Class, Section will be inserted in Admission
  const handleSubmit = () => {
    console.log('Submitted Form:', form.value)
    message.value = 'Form submitted successfully!'
    resetForm()
    setTimeout(() => (message.value = ''), 3000)
  }

  return {
    form,
    classOptions,
    sectionOptions,
    message,
    handleSubmit
  }
}
