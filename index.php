<?php
session_start();
include 'db.php';

$message = "";

// Handle Student Registration
if(isset($_POST['register'])){
    $name = $_POST['name'];
    $class = $_POST['class'];
    $roll = $_POST['roll'];
    $whatsapp = $_POST['whatsapp'];
    $password = $_POST['password'];
    $cpassword = $_POST['cpassword'];
    $academic_year = date('Y');

    if($password != $cpassword){
        $message = "Passwords do not match!";
    } else {
        // Generate student_id S[Year][Class][Roll]
        $student_id = "S".$academic_year.str_pad($class,2,'0',STR_PAD_LEFT).str_pad($roll,3,'0',STR_PAD_LEFT);
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Check if student_id exists
        $stmt = $conn->prepare("SELECT * FROM students WHERE student_id=?");
        $stmt->bind_param("s",$student_id);
        $stmt->execute();
        $res = $stmt->get_result();
        if($res->num_rows>0){
            $message = "Student ID already exists!";
        } else {
            $stmt_insert = $conn->prepare("INSERT INTO students (student_id,name,class,roll,whatsapp,password,status) VALUES (?,?,?,?,?,?, 'pending')");
            $stmt_insert->bind_param("ssiiss",$student_id,$name,$class,$roll,$whatsapp,$hashed_password);
            if($stmt_insert->execute()){
                $message = "Registration Successful! Your Student ID is ".$student_id;
            } else {
                $message = "Registration failed!";
            }
        }
    }
}

// Handle Login
if(isset($_POST['login'])){
    $user = $_POST['user'];
    $pass = $_POST['password'];

    // Check if admin
    $admin_email = "admin@example.com"; // set your admin email
    $admin_pass = "admin123";           // set your admin password

    if($user == $admin_email && $pass == $admin_pass){
        $_SESSION['admin'] = true;
        header("Location: admin_panel.php");
        exit();
    } else {
        // Check student
        $stmt = $conn->prepare("SELECT * FROM students WHERE student_id=? AND status='approved'");
        $stmt->bind_param("s",$user);
        $stmt->execute();
        $res = $stmt->get_result();
        if($res->num_rows>0){
            $stu = $res->fetch_assoc();
            if(password_verify($pass,$stu['password'])){
                $_SESSION['student'] = true;
                $_SESSION['student_id'] = $stu['student_id'];
                $_SESSION['student_name'] = $stu['name'];
                header("Location: student_panel.php");
                exit();
            } else { $message="Incorrect password!"; }
        } else { $message="User not found or not approved!"; }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login & Registration - The Academic Care</title>
<style>
body{font-family:Arial,sans-serif; padding:20px;}
h1,h2{text-align:center;}
form{margin:20px auto; max-width:400px; padding:20px; border:1px solid #ccc;}
input, select{width:100%; padding:8px; margin:5px 0;}
button{padding:10px; width:100%; background:#2980B9; color:white; border:none; cursor:pointer;}
button:hover{background:#3498DB;}
.message{color:red; text-align:center;}
</style>
</head>
<body>
<h1>The Academic Care</h1>
<h2>Academic Year <?php echo date('Y'); ?></h2>

<div class="message"><?php echo $message; ?></div>

<!-- Login Form -->
<form method="post">
    <h3>Login</h3>
    <input type="text" name="user" placeholder="Student ID or Admin Email" required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit" name="login">Login</button>
</form>

<!-- Registration Form -->
<form method="post">
    <h3>Student Registration</h3>
    <input type="text" name="name" placeholder="Full Name" required>
    <select name="class" required>
        <option value="">Select Class</option>
        <?php for($i=6;$i<=12;$i++){ echo "<option value='$i'>$i</option>"; } ?>
    </select>
    <input type="number" name="roll" placeholder="Roll Number" required>
    <input type="text" name="whatsapp" placeholder="WhatsApp Number" required>
    <input type="password" name="password" placeholder="Password" required>
    <input type="password" name="cpassword" placeholder="Confirm Password" required>
    <button type="submit" name="register">Submit Registration</button>
</form>

</body>
</html>
