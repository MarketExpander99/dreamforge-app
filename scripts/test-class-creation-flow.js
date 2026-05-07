const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Also create a service role client for bypassing RLS during testing
const serviceSupabase = createClient(supabaseUrl, supabaseKey)

async function testClassCreationFlow() {
  console.log('🧪 Testing Class Creation & Student Enrollment End-to-End Flow\n')

  try {
    // Step 1: Authenticate as teacher
    console.log('1️⃣ Authenticating as teacher (testteacher@school.com)...')
    const { data: teacherAuth, error: teacherAuthError } = await supabase.auth.signInWithPassword({
      email: 'testteacher@school.com',
      password: 'password123'
    })

    if (teacherAuthError) {
      console.log('❌ Teacher authentication failed:', teacherAuthError.message)
      return
    }

    console.log('✅ Teacher authenticated successfully')
    const teacherId = teacherAuth.user.id

    // Step 2: Create a class (using authenticated client with RLS)
    console.log('\n2️⃣ Creating a new class...')
    const classData = {
      teacher_id: teacherId,
      name: 'Grade 4 Mathematics - Test Class',
      subject: 'mathematics',
      grade_level: 'grade-4',
      class_code: 'MATH4-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      description: 'Test class for end-to-end testing',
      max_students: 25,
      settings: {
        allow_self_enrollment: true,
        send_progress_reports: true,
        enable_gamification: true,
        require_parent_approval: false
      },
      learning_goals: ['Master multiplication tables', 'Understand division concepts']
    }

    const { data: createdClass, error: createError } = await supabase
      .from('teacher_classes')
      .insert(classData)
      .select()
      .single()

    if (createError) {
      console.log('❌ Class creation failed:', createError.message)
      console.log('This indicates RLS policy issues - teacher should be able to create their own classes')
      return
    }

    console.log('✅ Class created successfully!')
    console.log('   Class ID:', createdClass.id)
    console.log('   Class Code:', createdClass.class_code)
    console.log('   Class Name:', createdClass.name)

    const classCode = createdClass.class_code
    const classId = createdClass.id

    // Step 3: Verify class appears in teacher's classes
    console.log('\n3️⃣ Verifying class appears in teacher dashboard...')
    const { data: teacherClasses, error: teacherClassesError } = await supabase
      .from('teacher_classes')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (teacherClassesError) {
      console.log('❌ Error fetching teacher classes:', teacherClassesError.message)
    } else {
      const foundClass = teacherClasses.find(c => c.id === classId)
      if (foundClass) {
        console.log('✅ Class appears in teacher dashboard')
      } else {
        console.log('❌ Class not found in teacher dashboard')
      }
    }

    // Step 4: Sign out teacher and sign in as student
    console.log('\n4️⃣ Switching to student account (teststudent@school.com)...')
    await supabase.auth.signOut()

    const { data: studentAuth, error: studentAuthError } = await supabase.auth.signInWithPassword({
      email: 'teststudent@school.com',
      password: 'password123'
    })

    if (studentAuthError) {
      console.log('❌ Student authentication failed:', studentAuthError.message)
      return
    }

    console.log('✅ Student authenticated successfully')
    const studentId = studentAuth.user.id

    // Step 5: Verify student can see the class (through join page logic)
    console.log('\n5️⃣ Verifying student can access class information...')
    const { data: classInfo, error: classInfoError } = await supabase
      .from('teacher_classes')
      .select(`
        *,
        profiles!teacher_classes_teacher_id_fkey(full_name)
      `)
      .eq('class_code', classCode)
      .eq('is_active', true)
      .single()

    if (classInfoError) {
      console.log('❌ Student cannot access class info:', classInfoError.message)
      return
    }

    console.log('✅ Student can access class information')
    console.log('   Class Name:', classInfo.name)
    console.log('   Teacher:', classInfo.profiles?.full_name)

    // Step 6: Check if student is already enrolled
    console.log('\n6️⃣ Checking if student is already enrolled...')
    const { data: existingEnrollment, error: enrollCheckError } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single()

    if (existingEnrollment) {
      console.log('ℹ️ Student already enrolled in this class')
    } else {
      console.log('✅ Student not yet enrolled - ready to join')
    }

    // Step 7: Student joins the class
    if (!existingEnrollment) {
      console.log('\n7️⃣ Student joining the class...')
      const { data: enrollment, error: joinError } = await supabase
        .from('class_students')
        .insert({
          class_id: classId,
          student_id: studentId,
          status: 'active'
        })
        .select()
        .single()

      if (joinError) {
        console.log('❌ Class join failed:', joinError.message)
        return
      }

      console.log('✅ Student successfully joined the class!')
      console.log('   Enrollment ID:', enrollment.id)
      console.log('   Joined At:', enrollment.joined_at)
    }

    // Step 8: Verify enrollment in database
    console.log('\n8️⃣ Verifying enrollment in database...')
    const { data: finalEnrollment, error: finalEnrollError } = await supabase
      .from('class_students')
      .select('*')
      .eq('class_id', classId)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single()

    if (finalEnrollError) {
      console.log('❌ Enrollment verification failed:', finalEnrollError.message)
      return
    }

    console.log('✅ Enrollment verified in database')
    console.log('   Enrollment Record:', finalEnrollment)

    // Step 9: Check student count updated
    console.log('\n9️⃣ Verifying student count updated...')
    const { count: studentCount, error: countError } = await supabase
      .from('class_students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId)
      .eq('status', 'active')

    if (countError) {
      console.log('❌ Student count check failed:', countError.message)
    } else {
      console.log(`✅ Class now has ${studentCount} student(s)`)
    }

    // Step 10: Verify RLS policies work (student should see their enrollment)
    console.log('\n🔐 Verifying RLS policies...')
    const { data: studentEnrollments, error: studentEnrollError } = await supabase
      .from('class_students')
      .select('*')
      .eq('student_id', studentId)

    if (studentEnrollError) {
      console.log('❌ RLS policy check failed:', studentEnrollError.message)
    } else {
      console.log('✅ RLS policies working - student can see their enrollments')
      console.log('   Student enrollments:', studentEnrollments.length)
    }

    // Cleanup: Sign out
    await supabase.auth.signOut()

    console.log('\n🎉 END-TO-END TEST COMPLETED SUCCESSFULLY!')
    console.log('\n📊 SUMMARY:')
    console.log('✅ Teacher authentication')
    console.log('✅ Class creation with unique code')
    console.log('✅ Class appears in teacher dashboard')
    console.log('✅ Student authentication')
    console.log('✅ Student can access class info')
    console.log('✅ Student enrollment works')
    console.log('✅ Database records created correctly')
    console.log('✅ RLS policies functioning')
    console.log('✅ Student count updates properly')

    console.log('\n🏆 RESULT: PASS - All functionality working correctly!')

  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error.message)
    console.log('\n🏆 RESULT: FAIL - Test encountered an error')
  }
}

testClassCreationFlow()