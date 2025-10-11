<?php
session_start();
include 'db.php';

// Check if student is logged in
if(!isset($_SESSION['student'])){
    header("Location: index.php");
    exit();
}

$student_id = $_SESSION['student_id'];
$months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
$current_month_index = date('n')-1;
?>

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Student Panel - The Academic Care</title>
<link rel="stylesheet" href="style.css">
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<style>
.tabs-menu { display: flex; flex-wrap: wrap; margin-bottom:10px; }
.tabs-menu button { flex:1; padding:10px; cursor:pointer; background-color:#2980B9; color:white; border:none; margin:1px; }
.tabs-menu button:hover { background-color:#3498DB; }
.tab { display:none; }
.tab.active { display:block; }
table { width:100%; border-collapse: collapse; }
table, th, td { border:1px solid #ddd; }
th, td { padding:5px; text-align:center; }
</style>
<script>
function openTab(tabName){
    var tabs = document.getElementsByClassName('tab');
    for(var i=0;i<tabs.length;i++){ tabs[i].classList.remove('active'); }
    document.getElementById(tabName).classList.add('active');
}

// Student break request Ajax
function requestBreak(month){
    $.ajax({
        url: 'ajax_student.php',
        method: 'POST',
        data: {action:'request_break', student_id:'<?php echo $student_id; ?>', month_name:month},
        success:function(response){
            let res = JSON.parse(response);
            alert(res.msg);
            if(res.status=='success'){
                location.reload(); // refresh break request table
            }
        }
    });
}
</script>
</head>
<body>
<header>
    <h1>The Academic Care</h1>
    <h2>Academic Year 2025</h2>
</header>

<div class="tabs-menu">
    <button onclick="openTab('home')">Home</button>
    <button onclick="openTab('my_profile')">My Profile</button>
    <button onclick="openTab('tuition_status')">Tuition Fee Status</button>
    <button onclick="openTab('break_request')">Break Request</button>
    <form method="post" action="logout.php" style="display:inline;">
        <button type="submit">Sign Out</button>
    </form>
</div>

<!-- Home Tab -->
<div id="home" class="tab active">
    <h3>Welcome <?php echo $_SESSION['student_name']; ?>!</h3>
    <p>Select a tab above to view your profile, tuition fee status, or submit break requests.</p>
</div>

<!-- My Profile Tab -->
<div id="my_profile" class="tab">
    <h3>My Profile</h3>
    <?php
    $stmt = $conn->prepare("SELECT * FROM students WHERE student_id=?");
    $stmt->bind_param("s",$student_id);
    $stmt->execute();
    $res = $stmt->get_result();
    $stu = $res->fetch_assoc();
    ?>
    <table>
        <tr><th>Student ID</th><td><?php echo $stu['student_id']; ?></td></tr>
        <tr><th>Name</th><td><?php echo $stu['name']; ?></td></tr>
        <tr><th>Class</th><td><?php echo $stu['class']; ?></td></tr>
        <tr><th>Roll</th><td><?php echo $stu['roll']; ?></td></tr>
        <tr><th>WhatsApp</th><td><?php echo $stu['whatsapp']; ?></td></tr>
    </table>
</div>

<!-- Tuition Fee Status Tab -->
<div id="tuition_status" class="tab">
    <h3>Tuition Fee Status</h3>
    <table>
        <tr><th>Month</th><th>Status</th><th>Date</th><th>Method</th></tr>
        <?php
        for($i=0;$i<=$current_month_index;$i++){
            $month = $months[$i];
            $stmt_fee = $conn->prepare("SELECT * FROM tuition_fee WHERE student_id=? AND month_name=?");
            $stmt_fee->bind_param("ss",$student_id,$month);
            $stmt_fee->execute();
            $res_fee = $stmt_fee->get_result();
            if($res_fee->num_rows>0){
                $fee = $res_fee->fetch_assoc();
                $status = $fee['status'];
                $date = $fee['payment_date'];
                $method = $fee['payment_method'];
            } else {
                $status = "Unpaid"; $date="-"; $method="-";
                $stmt_insert = $conn->prepare("INSERT INTO tuition_fee (student_id,month_name,status) VALUES (?,?, 'Unpaid')");
                $stmt_insert->bind_param("ss",$student_id,$month);
                $stmt_insert->execute();
            }
            echo "<tr>";
            echo "<td>$month</td>";
            echo "<td>$status</td>";
            echo "<td>$date</td>";
            echo "<td>$method</td>";
            echo "</tr>";
        }
        ?>
    </table>
</div>

<!-- Break Request Tab -->
<div id="break_request" class="tab">
    <h3>Request Break</h3>
    <p>Select upcoming months to request break:</p>
    <?php
    for($i=$current_month_index+1;$i<12;$i++){
        $month = $months[$i];
        echo "<button onclick=\"requestBreak('$month')\">$month</button> ";
    }
    ?>
    <h4>Your Break Requests</h4>
    <table>
        <tr><th>Month</th><th>Status</th></tr>
        <?php
        $stmt_br = $conn->prepare("SELECT * FROM break_requests WHERE student_id=?");
        $stmt_br->bind_param("s",$student_id);
        $stmt_br->execute();
        $res_br = $stmt_br->get_result();
        while($br = $res_br->fetch_assoc()){
            echo "<tr><td>".$br['month_name']."</td><td>".$br['status']."</td></tr>";
        }
        ?>
    </table>
</div>

<script>openTab('home');</script>
</body>
</html>
